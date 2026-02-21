// back-end/routes/project.routes.js
const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { tryAuth } = require('../middleware/tryAuth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadProject } = require('../middleware/multer.middleware');
const { permitPerm } = require('../middleware/rbac.middleware');
const { PERMS } = require('../constants/permissions.constants');
const {
  projectIdParam,
  listProjectsQuery,
  createProjectValidators,
  updateProjectValidators,
} = require('../validators/projects.validators');
/**
 * 🧩 Projects Routes
 * אחריות: CRUD לפרויקטים + חשיפה מבוקרת לפי isPublished/ownership/admin.
 *
 * הערות:
 * - list/get עובדים עם tryAuth: ציבורי עובד בלי JWT, ואם יש JWT מקבלים “viewer” לסינון/חשיפה.
 * - קבצים: uploadProject שומר בתתי־תיקיות חכמות לפי סוג (projectImages / projectFiles).
 */

// POST /api/projects
// יצירת פרויקט: student/designer/admin בלבד + העלאת קבצים עד 10
router.post(
  '/',
  authMiddleware,
  permitPerm(PERMS.PROJECTS_CREATE),
  uploadProject.array('files', 10),
  createProjectValidators,
  validate,
  createProject
);

// GET /api/projects
// רשימת פרויקטים: ציבורי (published בלבד), עם הרחבות לבעלים/אדמין כשיש JWT
router.get('/', tryAuth, listProjectsQuery, validate, getAllProjects);

// GET /api/projects/:id
// פרויקט יחיד: ציבורי, אבל קבצים רגישים (projectFiles) רק לבעלים/אדמין
router.get('/:id', tryAuth, projectIdParam, validate, getProjectById);

// PUT /api/projects/:id
// עדכון פרויקט: בעלים או אדמין (ההרשאה הסופית בקונטרולר/לוגיקה) + העלאת קבצים
router.put(
  '/:id',
  authMiddleware,
  permitPerm(PERMS.PROJECTS_UPDATE),
  projectIdParam, // ✅ לפני multer כדי לא להעלות קבצים על id לא תקין
  validate, // ✅ גם לפני multer כדי לעצור מוקדם
  uploadProject.array('files', 10),
  updateProjectValidators, // מכיל גם id אבל זה בסדר
  validate,
  updateProject
);

// DELETE /api/projects/:id
// מחיקה: בעלים או אדמין + ניקוי קבצים פיזיים + מחיקת תגובות/חישוב דירוגים
router.delete(
  '/:id',
  authMiddleware,
  permitPerm(PERMS.PROJECTS_DELETE),
  projectIdParam,
  validate,
  deleteProject
);

module.exports = router;
