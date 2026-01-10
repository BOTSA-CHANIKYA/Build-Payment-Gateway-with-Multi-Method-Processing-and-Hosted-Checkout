// backend/utils/validation.js

// VPA validation: username@bank
function validateVPA(vpa) {
  const vpaRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/;
  return vpaRegex.test(vpa);
}

// Luhn algorithm for card
function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '').split('').map(Number);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

// Card network detection
function detectCardNetwork(cardNumber) {
  const num = cardNumber.replace(/\D/g, '');
  if (num.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(num)) return 'mastercard';
  if (/^3[47]/.test(num)) return 'amex';
  if (/^(60|65|8[1-9])/.test(num)) return 'rupay';
  return 'unknown';
}

// Expiry validation
function validateExpiry(month, year) {
  const m = parseInt(month, 10);
  if (m < 1 || m > 12) return false;

  let y = parseInt(year, 10);
  if (year.length === 2) y += 2000;

  const expiry = new Date(y, m, 0);
  const now = new Date();
  now.setDate(1);
  return expiry >= now;
}

module.exports = {
  validateVPA,
  luhnCheck,
  detectCardNetwork,
  validateExpiry
};
