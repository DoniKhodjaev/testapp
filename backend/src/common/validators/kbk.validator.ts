/**
 * KBK (Budget Classification Code) validator
 * Format: 20 digits
 */
export class KbkValidator {
  static validate(kbk: string): boolean {
    if (!kbk || typeof kbk !== 'string') {
      return false;
    }

    // Remove spaces
    kbk = kbk.replace(/\s/g, '');

    // Must be exactly 20 digits
    return /^\d{20}$/.test(kbk);
  }
}

/**
 * OKTMO (Russian Classification of Municipal Territories) validator
 * Format: 8 or 11 digits
 */
export class OktmoValidator {
  static validate(oktmo: string): boolean {
    if (!oktmo || typeof oktmo !== 'string') {
      return false;
    }

    // Remove spaces
    oktmo = oktmo.replace(/\s/g, '');

    // Must be 8 or 11 digits
    return /^\d{8}$/.test(oktmo) || /^\d{11}$/.test(oktmo);
  }
}

/**
 * UIP (Unique Accrual Identifier) validator
 * Format: 20 or 25 characters (digits or specific format)
 */
export class UipValidator {
  static validate(uip: string): boolean {
    if (!uip || typeof uip !== 'string') {
      return false;
    }

    // Remove spaces
    uip = uip.replace(/\s/g, '');

    // Must be 20 or 25 digits
    return /^\d{20}$/.test(uip) || /^\d{25}$/.test(uip);
  }
}
