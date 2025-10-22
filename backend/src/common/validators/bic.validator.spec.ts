import { BicValidator } from './bic.validator';

describe('BicValidator', () => {
  describe('validate', () => {
    describe('valid BICs', () => {
      it('should validate correct Russian BIC codes', () => {
        expect(BicValidator.validate('044525225')).toBe(true); // Sberbank Moscow
        expect(BicValidator.validate('044525411')).toBe(true); // Alfa-Bank
        expect(BicValidator.validate('044525593')).toBe(true); // VTB Bank
        expect(BicValidator.validate('044030001')).toBe(true); // Bank in Saint Petersburg
        expect(BicValidator.validate('049920001')).toBe(true); // Bank in another region
      });

      it('should accept BIC with spaces', () => {
        expect(BicValidator.validate('044 525 225')).toBe(true);
        expect(BicValidator.validate('04 45 25 225')).toBe(true);
      });

      it('should accept BIC with country code 04 and any valid region', () => {
        for (let region = 0; region <= 99; region++) {
          const regionStr = region.toString().padStart(2, '0');
          const bic = `04${regionStr}12345`;
          expect(BicValidator.validate(bic)).toBe(true);
        }
      });
    });

    describe('invalid formats', () => {
      it('should reject null or undefined', () => {
        expect(BicValidator.validate(null as any)).toBe(false);
        expect(BicValidator.validate(undefined as any)).toBe(false);
      });

      it('should reject non-string values', () => {
        expect(BicValidator.validate(123456789 as any)).toBe(false);
        expect(BicValidator.validate({} as any)).toBe(false);
        expect(BicValidator.validate([] as any)).toBe(false);
      });

      it('should reject empty string', () => {
        expect(BicValidator.validate('')).toBe(false);
      });

      it('should reject wrong length', () => {
        expect(BicValidator.validate('04452522')).toBe(false); // 8 digits
        expect(BicValidator.validate('0445252250')).toBe(false); // 10 digits
        expect(BicValidator.validate('123')).toBe(false); // Too short
      });

      it('should reject non-numeric characters', () => {
        expect(BicValidator.validate('04452522A')).toBe(false);
        expect(BicValidator.validate('044525-25')).toBe(false);
        expect(BicValidator.validate('ABC123456')).toBe(false);
      });

      it('should reject wrong country code', () => {
        expect(BicValidator.validate('014525225')).toBe(false); // Country code 01
        expect(BicValidator.validate('034525225')).toBe(false); // Country code 03
        expect(BicValidator.validate('054525225')).toBe(false); // Country code 05
        expect(BicValidator.validate('104525225')).toBe(false); // Country code 10
        expect(BicValidator.validate('444525225')).toBe(false); // Country code 44
      });

      it('should reject all zeros', () => {
        expect(BicValidator.validate('000000000')).toBe(false);
      });
    });
  });
});
