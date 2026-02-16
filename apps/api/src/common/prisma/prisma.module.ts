import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  imports: [ClsModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
