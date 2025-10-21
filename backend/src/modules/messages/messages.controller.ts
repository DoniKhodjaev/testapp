import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  @RequirePermissions('messages:view')
  @ApiOperation({ summary: 'Get all messages' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.messagesService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions('messages:view')
  @ApiOperation({ summary: 'Get message by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.findOne(id, user.companyId);
  }

  @Post(':id/reply')
  @RequirePermissions('messages:reply')
  @ApiOperation({ summary: 'Reply to message' })
  reply(@Param('id') id: string, @Body() body: { body: string }, @CurrentUser() user: any) {
    return this.messagesService.reply(id, body.body, user.id, user.companyId);
  }
}
