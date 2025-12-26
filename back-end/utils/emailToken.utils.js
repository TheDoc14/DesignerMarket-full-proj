// back-end/utils/emailToken.utils.js
/**
 * יוטילים ליצירת/אימות tokens שמבוססים על מייל (verify/reset).
 * מפריד concerns: קונטרולר מנהל זרימה, והיוטיל מנהל יצירת token בצורה עקבית.
 */
const crypto = require('crypto');

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateVerificationToken };
