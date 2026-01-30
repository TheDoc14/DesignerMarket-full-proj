// back-end/validators/admin.validators.js
const { body, query } = require('express-validator');
const {
  pageLimitQuery,
  searchQuery,
  categoryQuery,
  sortByQuery,
  orderQuery,
  mongoIdParam,
} = require('./common.validators');
const { SORT_FIELDS } = require('../constants/validation.constants');
const { ROLES } = require('../constants/roles.constants');
/**
 * ✅ Admin Validators
 * מטרה: לעצור בקשות לא תקינות לפני שהקונטרולר רץ.
 * זה נותן:
 * - הודעות 400 אחידות וברורות
 * - פחות if-ים בתוך הקונטרולר
 */

// params
const userIdParam = mongoIdParam('id', 'Invalid user id');
const projectIdParam = mongoIdParam('id', 'Invalid project id');
// GET /api/admin/users?q=&role=&approved=&page=&limit=
const adminListUsersQuery = [
  ...searchQuery,
  query('role')
    .optional()
    .isIn([ROLES.ADMIN, ROLES.STUDENT, ROLES.DESIGNER, ROLES.CUSTOMER])
    .withMessage('role is invalid'),
  query('approved')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('approved must be true or false'),
  ...pageLimitQuery,
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
  ...sortByQuery(SORT_FIELDS.PROJECTS),
  ...searchQuery,
  ...categoryQuery,
  ...pageLimitQuery,
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
  ...pageLimitQuery,
  ...sortByQuery(SORT_FIELDS.REVIEWS),
  ...orderQuery,
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
