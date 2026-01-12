// back-end/middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

/**
 * rateLimit.middleware.js
 * הגנה בסיסית מפני spam / brute-force / flood.
 * מייצר limiter שמגביל מספר בקשות לפי IP בטווח זמן (window).
 *
 * הערה:
 * express-rate-limit מחזיר תשובת 429 בעצמו (לא עובר דרך errorHandler),
 * לכן אנחנו מגדירים message בפורמט אחיד כמו אצלכם: { success:false, code, message }.
 */

/**
 * createLimiter
 * factory שמחזיר limiter מוכן עם JSON אחיד.
 */
const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true, // מחזיר headers סטנדרטיים של RateLimit
    legacyHeaders: false,
    message: {
      success: false,
      code: 429,
      message,
    },
  });

/**
 * 🔐 authLimiterStrict
 * Limiter קשוח ל־login/reset/forgot כדי למנוע brute-force וספאם.
 */
const authLimiterStrict = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 10, // עד 10 בקשות לכל IP
  message: 'Too many requests. Please try again later.',
});

/**
 * ✉️ authLimiterSoft
 * Limiter יותר “רך” ל־resend/verify (עדיין מגביל אבל פחות אגרסיבי).
 */
const authLimiterSoft = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many requests. Please try again later.',
});

module.exports = { authLimiterStrict, authLimiterSoft };
