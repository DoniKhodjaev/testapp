import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentsImportService } from './payments-import.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { SignPaymentDto } from './dto/sign-payment.dto';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private importService: PaymentsImportService,
  ) {}

  @Post()
  @RequirePermissions('payments:create')
  @ApiOperation({ summary: 'Create payment' })
  create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(createPaymentDto, user.id, user.companyId);
  }

  @Get()
  @RequirePermissions('payments:view')
  @ApiOperation({ summary: 'Get all payments' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.paymentsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @RequirePermissions('payments:view')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id, user.companyId);
  }

  @Put(':id')
  @RequirePermissions('payments:edit')
  @ApiOperation({ summary: 'Update payment' })
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, user.companyId);
  }

  @Post(':id/submit')
  @RequirePermissions('payments:create')
  @ApiOperation({ summary: 'Submit payment for approval' })
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.submit(id, user.companyId, user.id);
  }

  @Post(':id/sign')
  @RequirePermissions('payments:sign')
  @ApiOperation({ summary: 'Sign payment' })
  sign(@Param('id') id: string, @Body() signDto: SignPaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.sign(id, signDto, user.companyId, user.id);
  }

  @Post(':id/send')
  @RequirePermissions('payments:send')
  @ApiOperation({ summary: 'Send payment to bank' })
  send(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.send(id, user.companyId, user.id);
  }

  @Delete(':id')
  @RequirePermissions('payments:delete')
  @ApiOperation({ summary: 'Delete payment' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.delete(id, user.companyId);
  }

  @Get(':id/history')
  @RequirePermissions('payments:view')
  @ApiOperation({ summary: 'Get payment history' })
  getHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.getHistory(id, user.companyId);
  }

  @Post('import')
  @RequirePermissions('payments:import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import payments from CSV/XLSX' })
  async importPayments(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    return this.importService.importFromFile(file, user.companyId, user.id);
  }

  @Get(':id/files')
  @RequirePermissions('payments:view')
  @ApiOperation({ summary: 'Get payment files' })
  getFiles(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.getFiles(id, user.companyId);
  }

  @Post(':id/files')
  @RequirePermissions('vkdocs:upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file to payment' })
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('docType') docType: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    return this.paymentsService.uploadFile(id, file, docType, user.id, user.companyId);
  }

  @Delete(':id/files/:fileId')
  @RequirePermissions('vkdocs:upload')
  @ApiOperation({ summary: 'Delete payment file' })
  deleteFile(@Param('fileId') fileId: string, @CurrentUser() user: any) {
    return this.paymentsService.deleteFile(fileId, user.companyId);
  }
}
