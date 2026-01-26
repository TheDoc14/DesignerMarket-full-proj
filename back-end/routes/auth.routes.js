//back-end/routes/auth.routes
const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { uploadApproval } = require('../middleware/multer.middleware');
const { authLimiterStrict, authLimiterSoft } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');
const { verifyRecaptchaV3 } = require('../middleware/captcha.middleware');

const {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  resendVerificationValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require('../validators/auth.validators');

/**
 * 🔐 Auth Routes
 * אחריות: הרשמה, אימות מייל, שליחה חוזרת של אימות, התחברות, שכחתי סיסמה + איפוס סיסמה.
 * הערה: הרשמה תומכת בהעלאת approvalDocument לסטודנט/מעצב (multer).
 */

// POST /api/auth/register
// הרשמה למערכת (כולל העלאת approvalDocument אם רלוונטי לתפקיד)
// הגנה בסיסית נגד spam
router.post(
  '/register',
  authLimiterStrict,
  uploadApproval.single('approvalDocument'),
  registerValidators,
  validate,
  verifyRecaptchaV3('register'),
  registerUser
);

// GET /api/auth/verify-email?token=...
// אימות מייל מתוך הקישור שנשלח למשתמש(Limiter רך)
router.get('/verify-email', authLimiterSoft, verifyEmailValidators, validate, verifyEmail);

// POST /api/auth/resend-verification
// שליחה מחדש של מייל אימות (למשתמש קיים שעוד לא אומת)(Limiter רך כדי למנוע spam מיילים)
router.post(
  '/resend-verification',
  authLimiterSoft,
  resendVerificationValidators,
  validate,
  verifyRecaptchaV3('resend-verification'),
  resendVerificationEmail
);

// POST /api/auth/login
// התחברות (נכשל אם המשתמש לא verified / או pending approval לתפקידים מסוימים)
//(Limiter קשוח נגד brute-force)
router.post(
  '/login',
  authLimiterStrict,
  loginValidators,
  validate,
  verifyRecaptchaV3('login'),
  loginUser
);

// POST /api/auth/forgot-password
// בקשת לינק לאיפוס סיסמה למייל (תשובה גנרית תמיד כדי לא לחשוף אם האימייל קיים)
//(Limiter קשוח נגד spam)
router.post(
  '/forgot-password',
  authLimiterStrict,
  forgotPasswordValidators,
  validate,
  verifyRecaptchaV3('forgot-password'),
  forgotPassword
);

// POST /api/auth/reset-password
// איפוס סיסמה בפועל לפי token + newPassword (חד-פעמי + תוקף)(Limiter קשוח)
router.post(
  '/reset-password',
  authLimiterStrict,
  resetPasswordValidators,
  validate,
  verifyRecaptchaV3('reset-password'),
  resetPassword
);

module.exports = router;
