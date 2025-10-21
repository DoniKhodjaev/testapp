/**
 * ИНН validator for Russian INN (Individual Tax Number)
 * Supports 10 digits (legal entities) and 12 digits (individuals)
 */
export class InnValidator {
  /**
   * Validate INN format and checksum
   */
  static validate(inn: string): boolean {
    if (!inn || typeof inn !== 'string') {
      return false;
    }

    // Remove spaces
    inn = inn.replace(/\s/g, '');

    // Check if only digits
    if (!/^\d+$/.test(inn)) {
      return false;
    }

    // Must be 10 or 12 digits
    if (inn.length !== 10 && inn.length !== 12) {
      return false;
    }

    if (inn.length === 10) {
      return this.validate10(inn);
    } else {
      return this.validate12(inn);
    }
  }

  /**
   * Validate 10-digit INN (legal entities)
   */
  private static validate10(inn: string): boolean {
    const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(inn[i]) * coefficients[i];
    }

    const checksum = (sum % 11) % 10;
    return checksum === parseInt(inn[9]);
  }

  /**
   * Validate 12-digit INN (individuals)
   */
  private static validate12(inn: string): boolean {
    const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

    // Check first control digit
    let sum1 = 0;
    for (let i = 0; i < 10; i++) {
      sum1 += parseInt(inn[i]) * coefficients1[i];
    }
    const checksum1 = (sum1 % 11) % 10;

    if (checksum1 !== parseInt(inn[10])) {
      return false;
    }

    // Check second control digit
    let sum2 = 0;
    for (let i = 0; i < 11; i++) {
      sum2 += parseInt(inn[i]) * coefficients2[i];
    }
    const checksum2 = (sum2 % 11) % 10;

    return checksum2 === parseInt(inn[11]);
  }
}
