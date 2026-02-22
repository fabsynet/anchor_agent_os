import { Module } from '@nestjs/common';
import { RenewalsService } from './renewals.service.js';
import { RenewalsScheduler } from './renewals.scheduler.js';

@Module({
  providers: [RenewalsService, RenewalsScheduler],
  exports: [RenewalsService],
})
export class RenewalsModule {}
