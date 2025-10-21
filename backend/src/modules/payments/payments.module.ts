import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentValidationService } from './payment-validation.service';
import { PaymentsImportService } from './payments-import.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentValidationService, PaymentsImportService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
