import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TimelineModule } from '../timeline/timeline.module.js';

@Module({
  imports: [AuthModule, TimelineModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
