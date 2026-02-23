import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BudgetsService } from './budgets.service.js';

@Injectable()
export class BudgetsScheduler {
  private readonly logger = new Logger(BudgetsScheduler.name);

  constructor(private readonly budgetsService: BudgetsService) {}

  /**
   * Monthly cron job at midnight on the 1st of each month (Toronto time).
   * Auto-renews budgets from the previous month with the same limits.
   * Wrapped in try/catch so failures don't crash the scheduler.
   */
  @Cron('0 0 0 1 * *', {
    name: 'auto-renew-budgets',
    timeZone: 'America/Toronto',
  })
  async handleBudgetAutoRenewal() {
    this.logger.log('Starting monthly budget auto-renewal...');
    try {
      await this.budgetsService.autoRenewBudgetsForAllTenants();
      this.logger.log('Budget auto-renewal complete.');
    } catch (error) {
      this.logger.error('Budget auto-renewal failed', error);
    }
  }
}
