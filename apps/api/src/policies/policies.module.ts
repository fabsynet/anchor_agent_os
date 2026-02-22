import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service.js';
import { PoliciesController } from './policies.controller.js';
import { AllPoliciesController } from './all-policies.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TimelineModule } from '../timeline/timeline.module.js';

@Module({
  imports: [AuthModule, TimelineModule],
  controllers: [PoliciesController, AllPoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
