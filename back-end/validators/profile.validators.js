// back-end/validators/profile.validators.js
const { body } = require('express-validator');
const { pageLimitQuery, sortByQuery, orderQuery, mongoIdParam } = require('./common.validators');
const { SORT_FIELDS } = require('../constants/validation.constants');
/**
 * ✅ Profile Validators
 * אחריות: ולידציה לקלט של Profile לפני שהקונטרולר רץ.
 */

// DELETE /api/profile/:id
const userIdParam = mongoIdParam('id', 'Invalid user id');

/**
 * PUT /api/profile/me
 * שימו לב:
 * - אתם תומכים גם ב-form-data (כולל profileImage) וגם ב-social כ-JSON string.
 * - לכן אנחנו עושים ולידציה "רכה": לא נשבור על social.
 */
const updateMyProfileValidators = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('firstName').optional().isString().withMessage('firstName must be a string'),
  body('lastName').optional().isString().withMessage('lastName must be a string'),
  body('bio')
    .optional()
    .isString()
    .withMessage('bio must be a string')
    .isLength({ max: 2000 })
    .withMessage('bio is too long'),
  body('city').optional().isString().withMessage('city must be a string'),
  body('country').optional().isString().withMessage('country must be a string'),
  body('phone').optional().isString().withMessage('phone must be a string'),
  body('paypalEmail')
    .optional()
    .custom((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))
    .withMessage('PayPal email must be a valid email'),
  // birthDate מגיע כ-YYYY-MM-DD. נוודא שזה תאריך תקין.
  body('birthDate')
    .optional()
    .custom((value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime()))
        throw new Error('Invalid birthDate format (expected ISO date)');
      return true;
    }),
  // social: אנחנו לא מקשיחים כאן כי אצלכם יש parse + normalize + "רך" בקונטרולר.
  // אם נקשיח מדי, נשבור בקלות form-data / JSON string.
];

// GET /api/profile/me? page=&limit=&sortBy=&order=
const myProfileProjectsQuery = [
  ...pageLimitQuery,
  // אותם עקרונות כמו projects list / reviews list: sortBy מוגבל לשדות מותרים
  ...sortByQuery(SORT_FIELDS.PROFILE_PROJECTS_ME),
  ...orderQuery,
];

// GET /api/profile/:id/projects?page=&limit=&sortBy=&order=
const profileProjectsQuery = [
  ...pageLimitQuery,
  ...sortByQuery(SORT_FIELDS.PROFILE_PROJECTS_PUBLIC),
  ...orderQuery,
];

module.exports = {
  userIdParam,
  updateMyProfileValidators,
  myProfileProjectsQuery,
  profileProjectsQuery,
};
