import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard.js';
import type { SuperAdminUser } from '../../auth/guards/super-admin.guard.js';
import { ImpersonationService } from './impersonation.service.js';

@Controller('admin/impersonation')
@UseGuards(SuperAdminGuard)
export class ImpersonationController {
  constructor(
    private readonly impersonationService: ImpersonationService,
  ) {}

  @Post('start')
  async startImpersonation(
    @Body() body: { targetUserId: string },
    @Req() req: { user: SuperAdminUser },
  ) {
    return this.impersonationService.startImpersonation(
      req.user.id,
      body.targetUserId,
    );
  }

  @Post('end')
  async endImpersonation(
    @Body() body: { targetUserId: string },
    @Req() req: { user: SuperAdminUser },
  ) {
    return this.impersonationService.endImpersonation(
      req.user.id,
      body.targetUserId,
    );
  }
}
