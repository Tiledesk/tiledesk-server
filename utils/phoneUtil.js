'use strict';


const { parsePhoneNumberFromString } = require('libphonenumber-js');

function normalizePhone(phone) {
  if (phone == null) return null;

  if (typeof phone !== 'string') {
    phone = String(phone);
  }

  let trimmed = phone.trim();
  if (!trimmed) return null;

  // Convert 00 to +
  if (trimmed.startsWith('00')) {
    trimmed = '+' + trimmed.slice(2);
  }

  // Remove spaces and strange characters (keep + initial)
  trimmed = trimmed.replace(/[^\d+]/g, '');

  // If it starts with +
  if (trimmed.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(trimmed);

    if (parsed && parsed.isValid()) {
      return parsed.number; // Correct E.164
    }

    // + present but not valid → remove the +
    return trimmed.replace(/^\+/, '');
  }

  // Try as international without +
  const parsedIntl = parsePhoneNumberFromString('+' + trimmed);

  if (parsedIntl && parsedIntl.isValid()) {
    return parsedIntl.number;
  }

  // Locale → return only digits
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly || null;
}


module.exports = {
    normalizePhone: normalizePhone
};