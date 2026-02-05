const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');
const { config } = require('../config');

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  
  let cleaned = phone.trim();
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/[^\d]/g, '');
  
  if (hasPlus && cleaned.length > 0) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

function validateAndFormatPhone(phone, defaultCountry = 'IN') {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      formatted: null,
      display: null,
      error: 'Phone number is missing',
      isMobile: false,
    };
  }

  try {
    let cleaned = cleanPhoneNumber(phone);
    
    if (!cleaned.startsWith('+')) {
      const defaultCode = config.phone.defaultCountryCode;
      if (!cleaned.startsWith(defaultCode)) {
        if (cleaned.startsWith('0')) {
          cleaned = cleaned.substring(1);
        }
        cleaned = '+' + defaultCode + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }

    if (!isValidPhoneNumber(cleaned)) {
      return {
        isValid: false,
        formatted: null,
        display: cleaned,
        error: 'Invalid phone number format',
        isMobile: false,
      };
    }

    const phoneNumber = parsePhoneNumber(cleaned);
    const phoneType = phoneNumber.getType();
    const isMobile = phoneType === 'MOBILE' || phoneType === 'FIXED_LINE_OR_MOBILE';
    const formatted = phoneNumber.countryCallingCode + phoneNumber.nationalNumber;

    return {
      isValid: true,
      formatted: formatted,
      display: phoneNumber.formatInternational(),
      error: null,
      isMobile: isMobile,
    };
  } catch (error) {
    return {
      isValid: false,
      formatted: null,
      display: phone,
      error: `Phone parsing error: ${error.message}`,
      isMobile: false,
    };
  }
}

function isLikelyLandline(phone) {
  const result = validateAndFormatPhone(phone);
  if (!result.isValid) return false;
  return result.isMobile === false;
}

module.exports = {
  cleanPhoneNumber,
  validateAndFormatPhone,
  isLikelyLandline,
};
