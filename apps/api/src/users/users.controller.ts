import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users
   * List all users in the current tenant. Admin only.
   */
  @Get()
  @Roles('admin')
  async findAll() {
    return this.usersService.findByTenant();
  }

  /**
   * PATCH /api/users/:id/setup-complete
   * Mark a user's setup wizard as completed.
   */
  @Patch(':id/setup-complete')
  async markSetupComplete(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.updateSetupCompleted(id);
  }
}
