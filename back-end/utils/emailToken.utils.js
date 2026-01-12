const crypto = require('crypto');

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * 🔐 Reset password token
 * מחזיר טוקן "גולמי" שישלח במייל
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * 🧾 Hash token
 * שומרים במסד רק hash (ולא את הטוקן עצמו)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

module.exports = {
  generateVerificationToken,
  generateResetToken,
  hashToken,
};
