import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module.js';
import { BadgeController } from './badge.controller.js';
import { BadgePublicController } from './badge-public.controller.js';
import { BadgeService } from './badge.service.js';

@Module({
  imports: [AlertsModule],
  controllers: [BadgeController, BadgePublicController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
