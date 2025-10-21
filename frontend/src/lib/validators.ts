/**
 * Client-side validators for Russian banking fields
 */

export const validateINN = (inn: string): boolean => {
  if (!inn || typeof inn !== 'string') return false;

  const innClean = inn.replace(/\s/g, '');

  if (!/^\d+$/.test(innClean)) return false;
  if (innClean.length !== 10 && innClean.length !== 12) return false;

  if (innClean.length === 10) {
    const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(innClean[i]) * coefficients[i];
    }
    const checksum = (sum % 11) % 10;
    return checksum === parseInt(innClean[9]);
  }

  // 12 digits
  const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

  let sum1 = 0;
  for (let i = 0; i < 10; i++) {
    sum1 += parseInt(innClean[i]) * coefficients1[i];
  }
  const checksum1 = (sum1 % 11) % 10;
  if (checksum1 !== parseInt(innClean[10])) return false;

  let sum2 = 0;
  for (let i = 0; i < 11; i++) {
    sum2 += parseInt(innClean[i]) * coefficients2[i];
  }
  const checksum2 = (sum2 % 11) % 10;
  return checksum2 === parseInt(innClean[11]);
};

export const validateBIC = (bic: string): boolean => {
  if (!bic || typeof bic !== 'string') return false;

  const bicClean = bic.replace(/\s/g, '');

  if (!/^\d{9}$/.test(bicClean)) return false;

  const countryCode = bicClean.substring(0, 2);
  if (countryCode !== '04') return false;

  return true;
};

export const validateAccount = (accountNo: string): boolean => {
  if (!accountNo || typeof accountNo !== 'string') return false;

  const accountClean = accountNo.replace(/\s/g, '');

  return /^\d{20}$/.test(accountClean);
};

export const formatAccountNumber = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  const match = clean.match(/.{1,4}/g);
  return match ? match.join(' ') : clean;
};

export const formatINN = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 12);
};

export const formatBIC = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};
