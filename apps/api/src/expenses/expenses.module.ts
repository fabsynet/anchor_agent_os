import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesScheduler } from './expenses.scheduler.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesScheduler],
  exports: [ExpensesService],
})
export class ExpensesModule {}
