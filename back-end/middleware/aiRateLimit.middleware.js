// back-end/middleware/aiRateLimit.middleware.js
const rateLimit = require('express-rate-limit');

/*
 * Limit the frequency of AI requests per IP before they reach the expensive AI pipeline.
 * This middleware reduces abuse, accidental flooding, and denial-of-service style pressure
 * on the consultation endpoints.
 */

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 429,
    message: 'Too many AI requests. Please try again soon.',
  },
});

module.exports = { aiLimiter };
