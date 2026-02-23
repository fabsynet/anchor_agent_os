import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service.js';
import { ComplianceController } from './compliance.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
