import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Get all users' })
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.companyId);
  }

  @Get(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user.companyId);
  }

  @Post()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Create user' })
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.usersService.create(body, user.companyId);
  }

  @Put(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.usersService.update(id, body, user.companyId);
  }

  @Post(':id/mfa/reset')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Reset MFA' })
  resetMfa(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.resetMfa(id, user.companyId);
  }
}
