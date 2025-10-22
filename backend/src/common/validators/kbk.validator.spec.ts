import { KbkValidator, OktmoValidator, UipValidator } from './kbk.validator';

describe('KbkValidator', () => {
  describe('validate', () => {
    it('should validate correct 20-digit KBK', () => {
      expect(KbkValidator.validate('18210102010011000110')).toBe(true);
      expect(KbkValidator.validate('00000000000000000000')).toBe(true);
      expect(KbkValidator.validate('12345678901234567890')).toBe(true);
    });

    it('should accept KBK with spaces', () => {
      expect(KbkValidator.validate('182 101 020 100 110 001 10')).toBe(true);
      expect(KbkValidator.validate('18210 10201 00110 00110')).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(KbkValidator.validate(null as any)).toBe(false);
      expect(KbkValidator.validate(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(KbkValidator.validate(123 as any)).toBe(false);
      expect(KbkValidator.validate({} as any)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(KbkValidator.validate('')).toBe(false);
    });

    it('should reject wrong length', () => {
      expect(KbkValidator.validate('123')).toBe(false);
      expect(KbkValidator.validate('1821010201001100011')).toBe(false); // 19 digits
      expect(KbkValidator.validate('182101020100110001101')).toBe(false); // 21 digits
    });

    it('should reject non-numeric characters', () => {
      expect(KbkValidator.validate('1821010201001100011A')).toBe(false);
      expect(KbkValidator.validate('18210102-100110001')).toBe(false);
      expect(KbkValidator.validate('ABC12345678901234567')).toBe(false);
    });
  });
});

describe('OktmoValidator', () => {
  describe('validate', () => {
    it('should validate correct 8-digit OKTMO', () => {
      expect(OktmoValidator.validate('45382000')).toBe(true); // Moscow
      expect(OktmoValidator.validate('40000000')).toBe(true); // Saint Petersburg
      expect(OktmoValidator.validate('12345678')).toBe(true);
      expect(OktmoValidator.validate('00000000')).toBe(true);
    });

    it('should validate correct 11-digit OKTMO', () => {
      expect(OktmoValidator.validate('45382000000')).toBe(true);
      expect(OktmoValidator.validate('12345678901')).toBe(true);
      expect(OktmoValidator.validate('00000000000')).toBe(true);
    });

    it('should accept OKTMO with spaces', () => {
      expect(OktmoValidator.validate('453 820 00')).toBe(true);
      expect(OktmoValidator.validate('45 38 20 00 000')).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(OktmoValidator.validate(null as any)).toBe(false);
      expect(OktmoValidator.validate(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(OktmoValidator.validate(123 as any)).toBe(false);
      expect(OktmoValidator.validate({} as any)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(OktmoValidator.validate('')).toBe(false);
    });

    it('should reject wrong length', () => {
      expect(OktmoValidator.validate('123')).toBe(false);
      expect(OktmoValidator.validate('1234567')).toBe(false); // 7 digits
      expect(OktmoValidator.validate('123456789')).toBe(false); // 9 digits
      expect(OktmoValidator.validate('1234567890')).toBe(false); // 10 digits
      expect(OktmoValidator.validate('123456789012')).toBe(false); // 12 digits
    });

    it('should reject non-numeric characters', () => {
      expect(OktmoValidator.validate('4538200A')).toBe(false);
      expect(OktmoValidator.validate('453-82000')).toBe(false);
      expect(OktmoValidator.validate('ABC12345')).toBe(false);
    });
  });
});

describe('UipValidator', () => {
  describe('validate', () => {
    it('should validate correct 20-digit UIP', () => {
      expect(UipValidator.validate('12345678901234567890')).toBe(true);
      expect(UipValidator.validate('00000000000000000000')).toBe(true);
      expect(UipValidator.validate('18210102010011000110')).toBe(true);
    });

    it('should validate correct 25-digit UIP', () => {
      expect(UipValidator.validate('1234567890123456789012345')).toBe(true);
      expect(UipValidator.validate('0000000000000000000000000')).toBe(true);
    });

    it('should accept UIP with spaces', () => {
      expect(UipValidator.validate('123 456 789 012 345 678 90')).toBe(true);
      expect(UipValidator.validate('12345 67890 12345 67890 12345')).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(UipValidator.validate(null as any)).toBe(false);
      expect(UipValidator.validate(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(UipValidator.validate(123 as any)).toBe(false);
      expect(UipValidator.validate({} as any)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(UipValidator.validate('')).toBe(false);
    });

    it('should reject wrong length', () => {
      expect(UipValidator.validate('123')).toBe(false);
      expect(UipValidator.validate('1234567890123456789')).toBe(false); // 19 digits
      expect(UipValidator.validate('123456789012345678901')).toBe(false); // 21 digits
      expect(UipValidator.validate('12345678901234567890123')).toBe(false); // 23 digits
      expect(UipValidator.validate('123456789012345678901234')).toBe(false); // 24 digits
      expect(UipValidator.validate('12345678901234567890123456')).toBe(false); // 26 digits
    });

    it('should reject non-numeric characters', () => {
      expect(UipValidator.validate('1234567890123456789A')).toBe(false);
      expect(UipValidator.validate('12345678901234567890-')).toBe(false);
      expect(UipValidator.validate('ABC1234567890123456789012')).toBe(false);
    });
  });
});
