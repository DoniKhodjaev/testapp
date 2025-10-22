import { InnValidator } from './inn.validator';

describe('InnValidator', () => {
  describe('validate', () => {
    describe('10-digit INN (legal entities)', () => {
      it('should validate correct 10-digit INN', () => {
        // Valid 10-digit INNs (verified to pass algorithm)
        expect(InnValidator.validate('7707083893')).toBe(true); // Yandex LLC
        expect(InnValidator.validate('7736207543')).toBe(true); // Sberbank
        expect(InnValidator.validate('7702070139')).toBe(true); // Gazprom
      });

      it('should reject incorrect 10-digit INN checksum', () => {
        expect(InnValidator.validate('7707083892')).toBe(false); // Wrong checksum
        expect(InnValidator.validate('7736207542')).toBe(false); // Wrong checksum
      });

      it('should accept INN with spaces', () => {
        expect(InnValidator.validate('7707 083893')).toBe(true);
        expect(InnValidator.validate('77 07 08 38 93')).toBe(true);
      });
    });

    describe('12-digit INN (individuals)', () => {
      it('should validate correct 12-digit INN', () => {
        // Valid 12-digit INN (verified to pass algorithm)
        expect(InnValidator.validate('500100732259')).toBe(true);
      });

      it('should reject incorrect 12-digit INN checksum', () => {
        expect(InnValidator.validate('500100732258')).toBe(false); // Wrong second checksum
        expect(InnValidator.validate('771401582721')).toBe(false); // Wrong second checksum
      });

      it('should accept INN with spaces', () => {
        expect(InnValidator.validate('500100 732259')).toBe(true);
        expect(InnValidator.validate('50 01 00 73 22 59')).toBe(true);
      });
    });

    describe('invalid formats', () => {
      it('should reject null or undefined', () => {
        expect(InnValidator.validate(null as any)).toBe(false);
        expect(InnValidator.validate(undefined as any)).toBe(false);
      });

      it('should reject non-string values', () => {
        expect(InnValidator.validate(123 as any)).toBe(false);
        expect(InnValidator.validate({} as any)).toBe(false);
        expect(InnValidator.validate([] as any)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(InnValidator.validate('')).toBe(false);
      });

      it('should reject wrong length', () => {
        expect(InnValidator.validate('123')).toBe(false); // Too short
        expect(InnValidator.validate('12345678901234567890')).toBe(false); // Too long
        expect(InnValidator.validate('12345678901')).toBe(false); // 11 digits
      });

      it('should reject non-numeric characters', () => {
        expect(InnValidator.validate('77070838A3')).toBe(false);
        expect(InnValidator.validate('7707-083893')).toBe(false);
        expect(InnValidator.validate('7707083893a')).toBe(false);
      });

      // Note: All zeros technically pass checksum validation (sum is 0, checksum is 0)
      // This is a mathematical edge case - in production you'd add business logic to reject it
    });
  });
});
