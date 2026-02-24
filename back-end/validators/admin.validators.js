// back-end/validators/admin.validators.js
const { body, query, param } = require('express-validator');
const Role = require('../models/Role.model');
const {
  pageLimitQuery,
  searchQuery,
  categoryQuery,
  sortByQuery,
  orderQuery,
  mongoIdParam,
} = require('./common.validators');
const { SORT_FIELDS } = require('../constants/validation.constants');
const { PERMS } = require('../constants/permissions.constants');

/**
 * ✅ Admin Validators (Dynamic RBAC aware)
 */

// params
const userIdParam = mongoIdParam('id', 'Invalid user id');
const projectIdParam = mongoIdParam('id', 'Invalid project id');

const keySlug = (value) => /^[a-z0-9-]{2,40}$/.test(String(value || '').trim());

const roleKeyExists = async (value) => {
  const key = String(value || '')
    .trim()
    .toLowerCase();
  const exists = await Role.exists({ key });
  if (!exists) throw new Error('role not found');
  return true;
};

const allowedPermsSet = new Set(Object.values(PERMS || {}));

// GET /api/admin/users?q=&role=&approved=&page=&limit=
const adminListUsersQuery = [
  ...searchQuery,
  query('role')
    .optional({ checkFalsy: true })
    .custom(keySlug)
    .withMessage('role must be lowercase slug: a-z 0-9 -')
    .bail()
    .custom(roleKeyExists),
  query('approved')
    .optional({ checkFalsy: true })
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

// ===== Dynamic RBAC: Roles management =====

const adminCreateRoleValidators = [
  body('key')
    .notEmpty()
    .withMessage('key is required')
    .custom(keySlug)
    .withMessage('role key must be lowercase slug: a-z 0-9 -'),

  body('label').optional().isString().trim().isLength({ max: 60 }).withMessage('label too long'),

  body('permissions').optional().isArray().withMessage('permissions must be an array'),

  body('permissions.*')
    .optional()
    .isString()
    .trim()
    .custom((p) => {
      if (!allowedPermsSet.has(p)) {
        throw new Error(`invalid permission: ${p}`);
      }
      return true;
    }),
];

const adminUpdateRoleValidators = [
  body('label').optional().isString().trim().isLength({ max: 60 }).withMessage('label too long'),

  body('permissions').optional().isArray().withMessage('permissions must be an array'),

  body('permissions.*')
    .optional()
    .isString()
    .trim()
    .isIn(Object.values(PERMS || {}))
    .withMessage('invalid permission'),
];

const adminDeleteRoleValidators = [
  param('key')
    .notEmpty()
    .withMessage('key is required')
    .custom(keySlug)
    .withMessage('invalid role key'),
];

const adminAssignUserRoleValidators = [
  body('role')
    .notEmpty()
    .withMessage('role is required')
    .custom(keySlug)
    .withMessage('role must be lowercase slug: a-z 0-9 -')
    .bail()
    .custom(roleKeyExists),
];

const listCategoriesQuery = [
  ...searchQuery, // q
  ...pageLimitQuery, // page/limit
];

const createCategoryValidators = [
  body('key')
    .notEmpty()
    .withMessage('key is required')
    .custom(keySlug)
    .withMessage('key must be lowercase slug: a-z 0-9 -'),
  body('label')
    .notEmpty()
    .withMessage('label is required')
    .isString()
    .trim()
    .isLength({ max: 60 })
    .withMessage('label too long'),
];

const updateCategoryValidators = [
  body('label').optional().isString().trim().isLength({ max: 60 }).withMessage('label too long'),
];

const categoryKeyParam = [
  param('key')
    .notEmpty()
    .withMessage('key is required')
    .custom(keySlug)
    .withMessage('invalid category key'),
];

module.exports = {
  userIdParam,
  projectIdParam,
  adminListUsersQuery,
  adminSetUserApprovalBody,
  adminListProjectsQuery,
  adminSetProjectPublishBody,
  adminListReviewsQuery,
  adminCreateRoleValidators,
  adminUpdateRoleValidators,
  adminDeleteRoleValidators,
  adminAssignUserRoleValidators,
  listCategoriesQuery,
  createCategoryValidators,
  updateCategoryValidators,
  categoryKeyParam,
};
