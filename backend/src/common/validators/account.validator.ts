/**
 * Bank account number validator for Russian accounts
 * Format: 20 digits
 * Validates checksum using BIC
 */
export class AccountValidator {
  /**
   * Validate account number with BIC
   */
  static validate(accountNo: string, bic: string): boolean {
    if (!accountNo || !bic || typeof accountNo !== 'string' || typeof bic !== 'string') {
      return false;
    }

    // Remove spaces
    accountNo = accountNo.replace(/\s/g, '');
    bic = bic.replace(/\s/g, '');

    // Account must be 20 digits
    if (!/^\d{20}$/.test(accountNo)) {
      return false;
    }

    // BIC must be 9 digits
    if (!/^\d{9}$/.test(bic)) {
      return false;
    }

    // Get correspondent account from BIC
    const corrAccount = '0' + bic.substring(4, 6) + accountNo.substring(0, 5);

    // Calculate checksum
    const coefficients = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1];

    let sum = 0;
    const fullNumber = bic.substring(6, 9) + accountNo;

    for (let i = 0; i < fullNumber.length; i++) {
      sum += (parseInt(fullNumber[i]) * coefficients[i]) % 10;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate account format only (without BIC)
   */
  static validateFormat(accountNo: string): boolean {
    if (!accountNo || typeof accountNo !== 'string') {
      return false;
    }

    // Remove spaces
    accountNo = accountNo.replace(/\s/g, '');

    // Must be exactly 20 digits
    return /^\d{20}$/.test(accountNo);
  }
}
