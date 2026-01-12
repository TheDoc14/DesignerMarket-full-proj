// back-end/validators/admin.validators.js
const { body, param, query } = require('express-validator');

/**
 * ✅ Admin Validators
 * מטרה: לעצור בקשות לא תקינות לפני שהקונטרולר רץ.
 * זה נותן:
 * - הודעות 400 אחידות וברורות
 * - פחות if-ים בתוך הקונטרולר
 */

// params
const userIdParam = [param('id').isMongoId().withMessage('Invalid user id')];
const projectIdParam = [param('id').isMongoId().withMessage('Invalid project id')];

// GET /api/admin/users?q=&role=&approved=&page=&limit=
const adminListUsersQuery = [
  query('q').optional().isString().withMessage('q must be a string'),
  query('role')
    .optional()
    .isIn(['admin', 'customer', 'student', 'designer'])
    .withMessage('role is invalid'),
  query('approved')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('approved must be true or false'),

  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
];

// PUT /api/admin/users/:id/approval
const adminSetUserApprovalBody = [
  body('isApproved')
    .notEmpty()
    .withMessage('isApproved is required')
    .isIn(['true', 'false', true, false])
    .withMessage('isApproved must be boolean'),
];

// GET /api/admin/projects?published=&q=&category=&page=&limit=
const adminListProjectsQuery = [
  query('published')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('published must be true or false'),

  query('q').optional().isString().withMessage('q must be a string'),
  query('category').optional().isString().withMessage('category must be a string'),

  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
];

// PUT /api/admin/projects/:id/publish
const adminSetProjectPublishBody = [
  body('isPublished')
    .notEmpty()
    .withMessage('isPublished is required')
    .isIn(['true', 'false', true, false])
    .withMessage('isPublished must be boolean'),
];

// GET /api/admin/reviews?projectId=&page=&limit=&sortBy=&order=
const adminListReviewsQuery = [
  query('projectId').optional().isMongoId().withMessage('Invalid project id'),

  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),

  query('sortBy').optional().isIn(['createdAt', 'rating']).withMessage('sortBy is invalid'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
];

module.exports = {
  userIdParam,
  projectIdParam,
  adminListUsersQuery,
  adminSetUserApprovalBody,
  adminListProjectsQuery,
  adminSetProjectPublishBody,
  adminListReviewsQuery,
};
