import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { createSupabaseAdmin } from '../common/config/supabase.config.js';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Maximum number of invited users per agency (admin + 2 = 3 total) */
const INVITE_CAP = 2;

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private readonly supabaseAdmin: SupabaseClient;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseAdmin = createSupabaseAdmin(configService);
    this.frontendUrl =
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Delete an unconfirmed user from Supabase auth by email.
   * This is needed because inviteUserByEmail creates a user in auth.users,
   * and Supabase won't allow re-inviting an existing user.
   * Only deletes if the user has NOT confirmed their email (never completed signup).
   */
  private async deleteUnconfirmedAuthUser(email: string): Promise<void> {
    const { data, error } =
      await this.supabaseAdmin.auth.admin.listUsers();

    if (error) {
      this.logger.warn(`Failed to list auth users: ${error.message}`);
      return;
    }

    const authUser = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!authUser) return;

    // Only delete if the user never confirmed (never set a password / completed signup)
    if (authUser.email_confirmed_at && authUser.last_sign_in_at) {
      throw new BadRequestException(
        'This user has already registered and confirmed their account',
      );
    }

    const { error: deleteError } =
      await this.supabaseAdmin.auth.admin.deleteUser(authUser.id);

    if (deleteError) {
      this.logger.warn(
        `Failed to delete unconfirmed auth user ${email}: ${deleteError.message}`,
      );
    } else {
      this.logger.log(`Deleted unconfirmed auth user: ${email}`);
    }
  }

  /**
   * Invite a user to the tenant.
   * Enforces invite cap of 2 users per agency.
   * Creates invitation record and calls Supabase inviteUserByEmail.
   */
  async inviteUser(
    tenantId: string,
    invitedById: string,
    email: string,
    role: 'admin' | 'agent',
  ) {
    // 1. Check invite cap: count pending + accepted invitations
    const inviteCount = await this.prisma.invitation.count({
      where: {
        tenantId,
        status: { in: ['pending', 'accepted'] },
      },
    });

    if (inviteCount >= INVITE_CAP) {
      throw new ForbiddenException(
        'Maximum invite limit reached (2 users)',
      );
    }

    // 2. Check for duplicate pending invite for same email
    const existingPending = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        email: email.toLowerCase(),
        status: 'pending',
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'An invitation is already pending for this email',
      );
    }

    // 3. Clean up any unconfirmed auth user from a previous invite attempt
    await this.deleteUnconfirmedAuthUser(email);

    // 4. Create invitation record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email: email.toLowerCase(),
        role,
        invitedById,
        status: 'pending',
        expiresAt,
      },
    });

    // 5. Call Supabase inviteUserByEmail
    try {
      const { error } =
        await this.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            invitation_id: invitation.id,
            tenant_id: tenantId,
            role,
          },
          redirectTo: `${this.frontendUrl}/accept-invite`,
        });

      if (error) {
        await this.prisma.invitation.delete({
          where: { id: invitation.id },
        });
        throw new BadRequestException(
          `Failed to send invitation: ${error.message}`,
        );
      }
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      await this.prisma.invitation.delete({
        where: { id: invitation.id },
      });
      throw new BadRequestException(
        'Failed to send invitation. Please try again.',
      );
    }

    return invitation;
  }

  /**
   * List all invitations for a tenant, ordered by newest first.
   */
  async listByTenant(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Revoke a pending or accepted invitation.
   * For pending: cleans up unconfirmed auth user.
   * For accepted: removes user from users table and deletes auth user.
   */
  async revokeInvitation(tenantId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, tenantId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!['pending', 'accepted'].includes(invitation.status)) {
      throw new BadRequestException(
        `Cannot revoke invitation with status "${invitation.status}"`,
      );
    }

    if (invitation.status === 'accepted') {
      // Remove the accepted user's access: delete DB user + auth user
      await this.revokeAcceptedUser(invitation.email, tenantId);
    } else {
      // Clean up the unconfirmed auth user so the email can be re-invited
      try {
        await this.deleteUnconfirmedAuthUser(invitation.email);
      } catch {
        // If deletion fails (user already confirmed), still revoke the invitation record
      }
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'revoked' },
    });
  }

  /**
   * Soft-deactivate an accepted user: set isActive=false and sign out all sessions.
   * Preserves the user record and all related data (agent profiles, tasks, expenses, etc.).
   */
  private async revokeAcceptedUser(
    email: string,
    tenantId: string,
  ): Promise<void> {
    // 1. Set isActive = false on the user record
    try {
      const dbUser = await this.prisma.user.findFirst({
        where: { email: email.toLowerCase(), tenantId },
      });

      if (dbUser) {
        await this.prisma.user.update({
          where: { id: dbUser.id },
          data: { isActive: false },
        });
        this.logger.log(`Deactivated user record for ${email}`);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to deactivate user record for ${email}: ${err.message}`);
    }

    // 2. Sign out all Supabase sessions so the user is kicked out immediately
    try {
      const { data, error } =
        await this.supabaseAdmin.auth.admin.listUsers();

      if (!error) {
        const authUser = data.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );

        if (authUser) {
          await this.supabaseAdmin.auth.admin.signOut(authUser.id, 'global');
          this.logger.log(`Signed out all sessions for ${email}`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to sign out auth user for ${email}: ${err.message}`);
    }
  }

  /**
   * Resend an invitation (pending or expired).
   * Deletes the old unconfirmed auth user and creates a fresh invite.
   */
  async resendInvitation(tenantId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, tenantId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!['pending', 'expired'].includes(invitation.status)) {
      throw new BadRequestException(
        `Cannot resend invitation with status "${invitation.status}"`,
      );
    }

    // Delete old unconfirmed auth user so inviteUserByEmail succeeds
    await this.deleteUnconfirmedAuthUser(invitation.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update expiry and set status back to pending
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { expiresAt, status: 'pending' },
    });

    // Re-send via Supabase (fresh invite)
    const { error } =
      await this.supabaseAdmin.auth.admin.inviteUserByEmail(
        invitation.email,
        {
          data: {
            invitation_id: invitation.id,
            tenant_id: tenantId,
            role: invitation.role,
          },
          redirectTo: `${this.frontendUrl}/accept-invite`,
        },
      );

    if (error) {
      throw new BadRequestException(
        `Failed to resend invitation: ${error.message}`,
      );
    }

    return updated;
  }

  /**
   * Accept a pending invitation by email.
   * Called by the database trigger or manually after user completes signup.
   */
  async acceptInvitation(email: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invitation) {
      return null;
    }

    const updated = await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' },
    });

    return updated;
  }
}
