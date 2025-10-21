import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentValidationService } from './payment-validation.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentValidationService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
