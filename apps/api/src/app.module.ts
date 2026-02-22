import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { TimelineModule } from './timeline/timeline.module.js';
import { PoliciesModule } from './policies/policies.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { RenewalsModule } from './renewals/renewals.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',                                      // apps/api/.env
        resolve(process.cwd(), '.env'),               // cwd .env
        resolve(process.cwd(), '../../.env'),          // monorepo root from apps/api/
      ],
    }),
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    InvitationsModule,
    TenantsModule,
    ClientsModule,
    TimelineModule,
    PoliciesModule,
    TasksModule,
    RenewalsModule,
    DashboardModule,
  ],
})
export class AppModule {}
