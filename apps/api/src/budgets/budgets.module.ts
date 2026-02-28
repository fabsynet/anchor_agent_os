import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module.js';
import { BudgetsService } from './budgets.service.js';
import { BudgetsController } from './budgets.controller.js';

@Module({
  imports: [AlertsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
