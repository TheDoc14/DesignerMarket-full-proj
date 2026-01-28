// back-end/validators/projects.validators.js
const { body } = require('express-validator');
const {
  pageLimitQuery,
  searchQuery,
  categoryQuery,
  priceRangeQuery,
  sortByQuery,
  orderQuery,
  mongoIdParam,
} = require('./common.validators');
const { SORT_FIELDS, LIMITS } = require('../constants/validation.constants');

/**
 * ✅ Projects Validators
 * אחריות: ולידציה לקלט של Projects (query + params + body) לפני שהקונטרולר רץ.
 */

// /api/projects/:id
const projectIdParam = mongoIdParam('id', 'Invalid project id');

// GET /api/projects (list)
const listProjectsQuery = [
  ...pageLimitQuery,
  ...searchQuery,
  ...categoryQuery,
  ...priceRangeQuery,
  ...sortByQuery(SORT_FIELDS.PROJECTS),
  ...orderQuery,
];

// POST /api/projects (create)  — multipart/form-data
const createProjectValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Title must be between 2 and 80 characters'),
  body('description').optional().isLength({ max: 5000 }).withMessage('Description is too long'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: LIMITS.MIN_LIMIT })
    .withMessage('Price must be a valid number'),
  body('category').optional().isString().withMessage('category must be a string').trim(),
  // mainImageIndex מגיע מה-body ובקונטרולר אתם משווים מול req.files.length
  // פה רק מוודאים שזה מספר שלם >=0. בדיקת "בתוך הטווח" נשארת בקונטרולר (כי תלויה בכמות הקבצים).
  body('mainImageIndex')
    .notEmpty()
    .withMessage('mainImageIndex is required')
    .isInt({ min: 0 })
    .withMessage('mainImageIndex must be a non-negative integer'),
  // tags יכולים להגיע כמחרוזת/מערך – לא נקשיח מדי כדי לא לשבור את הפרונט
];

// PUT /api/projects/:id (update) — multipart/form-data
const updateProjectValidators = [
  ...projectIdParam,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Title must be between 2 and 80 characters'),
  body('description').optional().isLength({ max: 5000 }).withMessage('Description is too long'),
  body('price')
    .optional()
    .isFloat({ min: LIMITS.MIN_LIMIT })
    .withMessage('Price must be a valid number'),
  body('category').optional().isString().withMessage('category must be a string').trim(),
  // mainImageId הוא ObjectId של אחד הקבצים — נוודא פורמט MongoId
  body('mainImageId').optional().isMongoId().withMessage('Invalid mainImageId'),
];

module.exports = {
  projectIdParam,
  listProjectsQuery,
  createProjectValidators,
  updateProjectValidators,
};
