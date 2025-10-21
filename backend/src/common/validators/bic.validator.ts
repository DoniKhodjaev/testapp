/**
 * BIC validator for Russian Bank Identification Code
 * Format: 9 digits
 */
export class BicValidator {
  /**
   * Validate BIC format
   */
  static validate(bic: string): boolean {
    if (!bic || typeof bic !== 'string') {
      return false;
    }

    // Remove spaces
    bic = bic.replace(/\s/g, '');

    // Must be exactly 9 digits
    if (!/^\d{9}$/.test(bic)) {
      return false;
    }

    // First 2 digits are country code (04 for Russia)
    const countryCode = bic.substring(0, 2);
    if (countryCode !== '04') {
      return false;
    }

    // Next 2 digits are region code (00-99)
    const regionCode = parseInt(bic.substring(2, 4));
    if (regionCode < 0 || regionCode > 99) {
      return false;
    }

    return true;
  }
}
