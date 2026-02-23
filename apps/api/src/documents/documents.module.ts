import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { DocumentsController } from './documents.controller.js';
import { TimelineModule } from '../timeline/timeline.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TimelineModule, AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
