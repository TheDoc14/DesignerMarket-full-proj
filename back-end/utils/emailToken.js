const crypto = require('crypto');

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateVerificationToken };
