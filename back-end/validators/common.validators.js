// back-end/validators/common.validators.js
const { query, param } = require('express-validator');
const { LIMITS, ORDER_VALUES } = require('../constants/validation.constants');

/// ✅ Common Validators
// מטרה: ולידציות נפוצות שניתן להשתמש בהן במקומות שונים בפרויקט.

const pageLimitQuery = [
  query('page')
    .optional()
    .isInt({ min: LIMITS.MIN_LIMIT })
    .withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: LIMITS.MIN_LIMIT, max: LIMITS.MAX_LIMIT })
    .withMessage(`limit must be between ${LIMITS.MIN_LIMIT} and ${LIMITS.MAX_LIMIT}`)
    .toInt(),
];

const orderQuery = [
  query('order')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(ORDER_VALUES)
    .withMessage('order must be asc or desc'),
];

const searchQuery = [query('q').optional().isString().withMessage('q must be a string').trim()];

const categoryQuery = [
  query('category').optional().isString().withMessage('category must be a string').trim(),
];

const priceRangeQuery = [
  query('minPrice')
    .optional()
    .isFloat({ min: LIMITS.MIN_LIMIT })
    .withMessage('minPrice must be >= 0')
    .toFloat(),
  query('maxPrice')
    .optional()
    .isFloat({ min: LIMITS.MIN_LIMIT })
    .withMessage('maxPrice must be >= 0')
    .toFloat(),
];

const sortByQuery = (allowedFields) => [
  query('sortBy').optional().isIn(allowedFields).withMessage('sortBy is invalid'),
];

const mongoIdParam = (paramName, msg = 'Invalid request') => [
  param(paramName).isMongoId().withMessage(msg),
];

module.exports = {
  pageLimitQuery,
  orderQuery,
  searchQuery,
  categoryQuery,
  priceRangeQuery,
  sortByQuery,
  mongoIdParam,
};
