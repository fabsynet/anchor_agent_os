import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RenewalsService } from './renewals.service.js';

@Injectable()
export class RenewalsScheduler {
  private readonly logger = new Logger(RenewalsScheduler.name);

  constructor(private readonly renewalsService: RenewalsService) {}

  /**
   * Daily cron job at 1:00 AM Toronto time.
   * Generates renewal tasks for all policies with expiration dates.
   * Wrapped in try/catch so failures don't crash the scheduler.
   */
  @Cron('0 0 1 * * *', {
    name: 'generate-renewal-tasks',
    timeZone: 'America/Toronto',
  })
  async handleRenewalGeneration() {
    this.logger.log('Starting daily renewal task generation...');
    try {
      await this.renewalsService.generateRenewalTasksForAllTenants();
      this.logger.log('Renewal task generation complete.');
    } catch (error) {
      this.logger.error('Renewal task generation failed', error);
    }
  }
}
