import { Injectable } from '@nestjs/common';
import { InnValidator } from '../../common/validators/inn.validator';
import { BicValidator } from '../../common/validators/bic.validator';
import { AccountValidator } from '../../common/validators/account.validator';
import { KbkValidator, OktmoValidator, UipValidator } from '../../common/validators/kbk.validator';

@Injectable()
export class PaymentValidationService {
  async validate(data: any): Promise<any[]> {
    const errors = [];

    // Receiver INN validation
    if (data.receiver?.inn && !InnValidator.validate(data.receiver.inn)) {
      errors.push({
        field: 'receiver.inn',
        code: 'INVALID_INN',
        message: 'Invalid INN checksum',
      });
    }

    // Receiver BIC validation
    if (data.receiver?.bic && !BicValidator.validate(data.receiver.bic)) {
      errors.push({
        field: 'receiver.bic',
        code: 'INVALID_BIC',
        message: 'Invalid BIC format',
      });
    }

    // Receiver account validation
    if (data.receiver?.accountNo && data.receiver?.bic) {
      if (!AccountValidator.validate(data.receiver.accountNo, data.receiver.bic)) {
        errors.push({
          field: 'receiver.accountNo',
          code: 'INVALID_ACCOUNT',
          message: 'Invalid account number checksum',
        });
      }
    }

    // Budget fields validation
    if (data.budget?.kbk && !KbkValidator.validate(data.budget.kbk)) {
      errors.push({
        field: 'budget.kbk',
        code: 'INVALID_KBK',
        message: 'Invalid KBK format (must be 20 digits)',
      });
    }

    if (data.budget?.oktmo && !OktmoValidator.validate(data.budget.oktmo)) {
      errors.push({
        field: 'budget.oktmo',
        code: 'INVALID_OKTMO',
        message: 'Invalid OKTMO format (must be 8 or 11 digits)',
      });
    }

    if (data.budget?.uip && !UipValidator.validate(data.budget.uip)) {
      errors.push({
        field: 'budget.uip',
        code: 'INVALID_UIP',
        message: 'Invalid UIP format (must be 20 or 25 digits)',
      });
    }

    // Amount validation
    if (data.amount !== undefined) {
      if (data.amount <= 0) {
        errors.push({
          field: 'amount',
          code: 'INVALID_AMOUNT',
          message: 'Amount must be greater than 0',
        });
      }

      // Check decimal places
      const amountStr = data.amount.toString();
      if (amountStr.includes('.')) {
        const decimalPart = amountStr.split('.')[1];
        if (decimalPart.length > 2) {
          errors.push({
            field: 'amount',
            code: 'TOO_MANY_DECIMALS',
            message: 'Amount can have at most 2 decimal places',
          });
        }
      }
    }

    // Purpose length
    if (data.purpose && data.purpose.length > 210) {
      errors.push({
        field: 'purpose',
        code: 'PURPOSE_TOO_LONG',
        message: 'Purpose must not exceed 210 characters',
      });
    }

    return errors;
  }
}
