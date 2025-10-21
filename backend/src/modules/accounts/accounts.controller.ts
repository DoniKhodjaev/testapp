import { Controller, Get, Post, Param, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  findAll(@CurrentUser() user: any) {
    return this.accountsService.findAll(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountsService.findOne(id, user.companyId);
  }

  @Get(':id/statements')
  @ApiOperation({ summary: 'Get statements' })
  getStatements(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: any,
  ) {
    return this.accountsService.getStatements(
      id,
      user.companyId,
      new Date(from),
      new Date(to),
    );
  }

  @Post(':id/statements/export')
  @ApiOperation({ summary: 'Generate statement' })
  generateStatement(
    @Param('id') id: string,
    @Body() body: { from: string; to: string; format?: string },
    @CurrentUser() user: any,
  ) {
    return this.accountsService.generateStatement(
      id,
      user.companyId,
      new Date(body.from),
      new Date(body.to),
    );
  }
}
