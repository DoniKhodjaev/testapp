import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CounterpartiesService } from './counterparties.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('counterparties')
@Controller('counterparties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CounterpartiesController {
  constructor(private counterpartiesService: CounterpartiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all counterparties' })
  findAll(@Query('query') query: string, @CurrentUser() user: any) {
    return this.counterpartiesService.findAll(user.companyId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create counterparty' })
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.counterpartiesService.create(body, user.companyId);
  }
}
