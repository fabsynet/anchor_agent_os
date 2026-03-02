import { Module } from '@nestjs/common';
import { CommunicationsController } from './communications.controller.js';
import { CommunicationsService } from './communications.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
})
export class CommunicationsModule {}
