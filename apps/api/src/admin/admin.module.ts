import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AuditModule } from './audit/audit.module.js';
import { AuditController } from './audit/audit.controller.js';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard.js';
import { AgenciesController } from './agencies/agencies.controller.js';
import { AgenciesService } from './agencies/agencies.service.js';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';
import { ImpersonationController } from './impersonation/impersonation.controller.js';
import { ImpersonationService } from './impersonation/impersonation.service.js';

@Module({
  imports: [ConfigModule, AuditModule],
  controllers: [
    AdminController,
    AuditController,
    AgenciesController,
    UsersController,
    ImpersonationController,
  ],
  providers: [
    AdminService,
    SuperAdminGuard,
    AgenciesService,
    UsersService,
    ImpersonationService,
  ],
  exports: [AuditModule],
})
export class AdminModule {}
