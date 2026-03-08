import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AuditModule } from './audit/audit.module.js';
import { AuditController } from './audit/audit.controller.js';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard.js';

@Module({
  imports: [ConfigModule, AuditModule],
  controllers: [AdminController, AuditController],
  providers: [AdminService, SuperAdminGuard],
  exports: [AuditModule],
})
export class AdminModule {}
