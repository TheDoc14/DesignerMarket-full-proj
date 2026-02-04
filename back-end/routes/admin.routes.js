// back-end/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { permitPerm } = require('../middleware/rbac.middleware');
const { PERMS } = require('../constants/permissions.constants');
const {
  adminListUsers,
  adminSetUserApproval,
  adminListProjects,
  adminSetProjectPublish,
  adminListReviews,
  adminGetStats,

  adminListRoles,
  adminCreateRole,
  adminUpdateRole,
  adminDeleteRole,
  adminAssignUserRole,
} = require('../controllers/admin.controller');
const {
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
} = require('../validators/admin.validators');

/**
 * 🛠️ Admin Routes
 * אחריות: פעולות ניהול מערכת (ניהול משתמשים/פרויקטים/תגובות + סטטיסטיקות).
 *
 * כלל־על: כל הראוטים כאן מוגנים ב־JWT + permit('admin') ברמת הראוטר.
 */
router.use(authMiddleware, permitPerm(PERMS.ADMIN_PANEL_ACCESS));

// Users //

// GET /api/admin/users?q=&role=&approved=&page=&limit=
// רשימת משתמשים עם סינון/חיפוש (כולל לא מאושרים)
router.get('/users', permitPerm(PERMS.USERS_READ), adminListUsersQuery, validate, adminListUsers);

// PUT /api/admin/users/:id/approval
// אישור/דחיית משתמש (isApproved)
router.put(
  '/users/:id/approval',
  permitPerm(PERMS.USERS_APPROVE),
  userIdParam,
  validate,
  adminSetUserApprovalBody,
  validate,
  adminSetUserApproval
);

// PUT /api/admin/users/:id/role
// הקצאת תפקיד למשתמש
router.put(
  '/users/:id/role',
  permitPerm(PERMS.USERS_ASSIGN_ROLE),
  userIdParam,
  validate,
  adminAssignUserRoleValidators,
  validate,
  adminAssignUserRole
);

// Projects //

// GET /api/admin/projects?published=&q=&category=&page=&limit=
// רשימת פרויקטים עם סינון/חיפוש (כולל לא מפורסמים)
router.get(
  '/projects',
  permitPerm(PERMS.USERS_READ),
  adminListProjectsQuery,
  validate,
  adminListProjects
);

// PUT /api/admin/projects/:id/publish
// פרסום/הסרת פרסום של פרויקט
router.put(
  '/projects/:id/publish',
  permitPerm(PERMS.PROJECTS_PUBLISH),
  projectIdParam,
  validate,
  adminSetProjectPublishBody,
  validate,
  adminSetProjectPublish
);

// Reviews //

// GET /api/admin/reviews?q=&projectId=&userId=&page=&limit=
// רשימת ביקורות עם סינון/חיפוש (כולל לפי פרויקט/משתמש)
router.get(
  '/reviews',
  permitPerm(PERMS.REVIEWS_MANAGE),
  adminListReviewsQuery,
  validate,
  adminListReviews
);

// Stats //

// GET /api/admin/stats
// סטטיסטיקות כלליות (מספר משתמשים/פרויקטים/ביקורות וכו׳)
router.get('/stats', permitPerm(PERMS.STATS_READ), adminGetStats);

// Roles CRUD //

// GET /api/admin/roles
// רשימת תפקידים קיימים
router.get('/roles', permitPerm(PERMS.ROLES_MANAGE), adminListRoles);

// POST /api/admin/roles
// יצירת תפקיד חדש
router.post(
  '/roles',
  permitPerm(PERMS.ROLES_MANAGE),
  adminCreateRoleValidators,
  validate,
  adminCreateRole
);

// PUT /api/admin/roles/:key
// עדכון תפקיד קיים (למשל שינוי permissions)
router.put(
  '/roles/:key',
  permitPerm(PERMS.ROLES_MANAGE),
  adminUpdateRoleValidators,
  validate,
  adminUpdateRole
);

// DELETE /api/admin/roles/:key
// מחיקת תפקיד (רק אם לא משויך למשתמשים)
router.delete(
  '/roles/:key',
  permitPerm(PERMS.ROLES_MANAGE),
  adminDeleteRoleValidators,
  validate,
  adminDeleteRole
);

module.exports = router;
