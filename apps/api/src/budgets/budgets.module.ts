import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module.js';
import { BudgetsService } from './budgets.service.js';
import { BudgetsScheduler } from './budgets.scheduler.js';
import { BudgetsController } from './budgets.controller.js';

@Module({
  imports: [AlertsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsScheduler],
  exports: [BudgetsService],
})
export class BudgetsModule {}
