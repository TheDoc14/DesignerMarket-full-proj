// back-end/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const {
  adminListUsers,
  adminSetUserApproval,
  adminListProjects,
  adminSetProjectPublish,
  adminListReviews,
  adminGetStats,
} = require('../controllers/admin.controller');

/**
 * 🛠️ Admin Routes
 * אחריות: פעולות ניהול מערכת (ניהול משתמשים/פרויקטים/תגובות + סטטיסטיקות).
 *
 * כלל־על: כל הראוטים כאן מוגנים ב־JWT + permit('admin') ברמת הראוטר.
 */
router.use(authMiddleware, permit('admin'));

// GET /api/admin/users?q=&role=&approved=&page=&limit=
// רשימת משתמשים (כולל pending approvals לסטודנטים/מעצבים)
router.get('/users', adminListUsers);

// PUT /api/admin/users/:id/approval
// עדכון isApproved לסטודנט/מעצב בלבד
router.put('/users/:id/approval', adminSetUserApproval);

// GET /api/admin/projects?published=&q=&category=&page=&limit=
// רשימת פרויקטים (כולל pending publish)
router.get('/projects', adminListProjects);

// PUT /api/admin/projects/:id/publish
// עדכון isPublished לפרויקט
router.put('/projects/:id/publish', adminSetProjectPublish);

// GET /api/admin/reviews?projectId=&page=&limit=&sortBy=&order=
// רשימת תגובות מערכתית (לאדמין)
router.get('/reviews', adminListReviews);

// GET /api/admin/stats
// סטטיסטיקות מערכת (MVP)
router.get('/stats', adminGetStats);

module.exports = router;
