// back-end/validators/reviews.validators.js
const { body, param, query } = require('express-validator');

/**
 * ✅ Reviews Validators
 * אחריות: ולידציה לקלט של Reviews (query + params + body) לפני שהקונטרולר רץ.
 */

// /api/reviews/:id
const reviewIdParam = [param('id').isMongoId().withMessage('Invalid review id')];

// GET /api/reviews?projectId=...&page=&limit=&sortBy=&order=
const listReviewsQuery = [
  query('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project id'),

  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),

  query('sortBy').optional().isIn(['createdAt', 'rating']).withMessage('sortBy is invalid'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
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
    .isInt({ min: 1, max: 5 })
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

  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

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
