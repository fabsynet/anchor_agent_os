import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpensesService } from './expenses.service.js';

@Injectable()
export class ExpensesScheduler {
  private readonly logger = new Logger(ExpensesScheduler.name);

  constructor(private readonly expensesService: ExpensesService) {}

  /**
   * Daily cron job at 2:00 AM Toronto time.
   * Creates child expenses for all recurring expenses whose nextOccurrence has arrived.
   * Wrapped in try/catch so failures don't crash the scheduler.
   */
  @Cron('0 0 2 * * *', {
    name: 'create-recurring-expenses',
    timeZone: 'America/Toronto',
  })
  async handleRecurringExpenses() {
    this.logger.log('Starting daily recurring expense creation...');
    try {
      await this.expensesService.createRecurringExpensesForAllTenants();
      this.logger.log('Recurring expense creation complete.');
    } catch (error) {
      this.logger.error('Recurring expense creation failed', error);
    }
  }
}
