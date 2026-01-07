// back-end/validators/projects.validators.js
const { body, param, query } = require('express-validator');

/**
 * ✅ Projects Validators
 * אחריות: ולידציה לקלט של Projects (query + params + body) לפני שהקונטרולר רץ.
 */

// /api/projects/:id
const projectIdParam = [param('id').isMongoId().withMessage('Invalid project id')];

// GET /api/projects (list)
const listProjectsQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),

  query('q').optional().isString().withMessage('q must be a string'),
  query('category').optional().isString().withMessage('category must be a string'),

  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be >= 0'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be >= 0'),

  // מיון: אצלכם בקונטרולר זה sortBy + order
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'price', 'averageRating', 'reviewsCount'])
    .withMessage('sortBy is invalid'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
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
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid number'),

  body('category').optional().isString().withMessage('Category must be a string'),

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

  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid number'),

  body('category').optional().isString().withMessage('Category must be a string'),

  // mainImageId הוא ObjectId של אחד הקבצים — נוודא פורמט MongoId
  body('mainImageId').optional().isMongoId().withMessage('mainImageId must be a valid id'),
];

module.exports = {
  projectIdParam,
  listProjectsQuery,
  createProjectValidators,
  updateProjectValidators,
};
