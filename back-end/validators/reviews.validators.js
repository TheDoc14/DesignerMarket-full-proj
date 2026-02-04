// back-end/validators/reviews.validators.js
const { body, query } = require('express-validator');
const { pageLimitQuery, sortByQuery, orderQuery, mongoIdParam } = require('./common.validators');
const { SORT_FIELDS, LIMITS } = require('../constants/validation.constants');
/**
 * ✅ Reviews Validators
 * אחריות: ולידציה לקלט של Reviews (query + params + body) לפני שהקונטרולר רץ.
 */

// /api/reviews/:id
const reviewIdParam = mongoIdParam('id', 'Invalid review id');

// GET /api/reviews?projectId=...&page=&limit=&sortBy=&order=
const listReviewsQuery = [
  query('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project id'),
  ...pageLimitQuery,
  ...sortByQuery(SORT_FIELDS.REVIEWS),
  ...orderQuery,
];

// POST /api/reviews
const createReviewValidators = [
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project id'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: LIMITS.MIN_LIMIT, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  // אצלכם השדה נקרא text
  body('text')
    .optional()
    .isString()
    .withMessage('Text must be a string')
    .isLength({ max: 2000 })
    .withMessage('Text is too long'),
];

// PUT /api/reviews/:id
const updateReviewValidators = [
  ...reviewIdParam,
  body('rating')
    .optional()
    .isInt({ min: LIMITS.MIN_LIMIT, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('text')
    .optional()
    .isString()
    .withMessage('Text must be a string')
    .isLength({ max: 2000 })
    .withMessage('Text is too long'),
];

module.exports = {
  reviewIdParam,
  listReviewsQuery,
  createReviewValidators,
  updateReviewValidators,
};
