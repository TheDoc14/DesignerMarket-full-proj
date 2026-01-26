// back-end/validators/auth.validators.js
const { body, query } = require('express-validator');

/**
 * ✅ Auth Validators
 * אחריות: ולידציה לקלט של Auth לפני שהקונטרולר רץ.
 */
const captchaTokenValidator = body('captchaToken')
  .trim()
  .notEmpty()
  .withMessage('Captcha token is required');

const registerValidators = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password is too short'),

  body('role').optional().isIn(['student', 'designer', 'customer']).withMessage('Invalid role'),

  captchaTokenValidator,
];

const loginValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid'),

  body('password').notEmpty().withMessage('Password is required'),

  captchaTokenValidator,
];

const verifyEmailValidators = [
  query('token').trim().notEmpty().withMessage('Verification token is required'),
];

const resendVerificationValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid'),

  captchaTokenValidator,
];

/**
 * 🔁 forgot-password
 * כאן יש לכם לוגיקה שמחזירה הודעה גנרית גם אם אין email,
 * כדי לא לחשוף האם משתמש קיים (anti enumeration).
 * לכן: אם אין email — לא נחסום.
 * אם יש email — נוודא שהוא אימייל תקין.
 */
const forgotPasswordValidators = [
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email is invalid'),

  captchaTokenValidator,
];

/**
 * 🔑 reset-password
 * כאן חובה token + newPassword, אחרת אין לנו איך לאפס.
 */
const resetPasswordValidators = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password is too short'),

  captchaTokenValidator,
];

module.exports = {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  resendVerificationValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
};
