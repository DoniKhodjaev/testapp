import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { StatementsService } from './statements.service';
import { GenerateStatementDto } from './dto/generate-statement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('statements')
@Controller('statements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatementsController {
  constructor(private statementsService: StatementsService) {}

  @Get()
  @RequirePermissions('statements:view')
  @ApiOperation({ summary: 'Get all statements' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.statementsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions('statements:view')
  @ApiOperation({ summary: 'Get statement by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.statementsService.findOne(id, user.companyId);
  }

  @Post('generate')
  @RequirePermissions('statements:view')
  @ApiOperation({ summary: 'Generate new statement' })
  async generate(
    @Body() generateStatementDto: GenerateStatementDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.statementsService.generateStatementData(
      generateStatementDto,
      user.companyId,
    );

    return {
      success: true,
      statementId: result.statement.id,
      meta: {
        openingBalance: result.openingBalance,
        closingBalance: result.closingBalance,
        totalDebit: result.totalDebit,
        transactionCount: result.payments.length,
      },
    };
  }

  @Get(':id/export/pdf')
  @RequirePermissions('statements:export')
  @ApiOperation({ summary: 'Export statement as PDF' })
  async exportPDF(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.statementsService.generatePDF(
      id,
      user.companyId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="statement_${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Get(':id/export/xlsx')
  @RequirePermissions('statements:export')
  @ApiOperation({ summary: 'Export statement as XLSX' })
  async exportXLSX(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const xlsxBuffer = await this.statementsService.generateXLSX(
      id,
      user.companyId,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="statement_${id}.xlsx"`,
      'Content-Length': xlsxBuffer.length,
    });

    res.status(HttpStatus.OK).send(xlsxBuffer);
  }
}
