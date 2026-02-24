import { Module } from '@nestjs/common';
import { ImportService } from './import.service.js';
import { ImportController } from './import.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TimelineModule } from '../timeline/timeline.module.js';

@Module({
  imports: [AuthModule, TimelineModule],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
