import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to set required roles for a route handler.
 * Used with RolesGuard to enforce role-based access control.
 *
 * Usage:
 *   @Roles('admin')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Post('invite')
 *   async inviteUser() {}
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
