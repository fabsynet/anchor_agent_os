import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { TenantsModule } from './tenants/tenants.module.js';

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
    ClsModule.forRoot({ middleware: { mount: true } }),
    PrismaModule,
    AuthModule,
    UsersModule,
    InvitationsModule,
    TenantsModule,
  ],
})
export class AppModule {}
