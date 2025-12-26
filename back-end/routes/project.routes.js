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
const { permit } = require('../middleware/role.middleware');
const { uploadProject } = require('../middleware/multer.middleware');
const { tryAuth } = require('../middleware/tryAuth.middleware');

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
  permit('designer', 'student', 'admin'),
  uploadProject.array('files', 10),
  createProject
);

// GET /api/projects
// רשימת פרויקטים: ציבורי (published בלבד), עם הרחבות לבעלים/אדמין כשיש JWT
router.get('/', tryAuth, getAllProjects);

// GET /api/projects/:id
// פרויקט יחיד: ציבורי, אבל קבצים רגישים (projectFiles) רק לבעלים/אדמין
router.get('/:id', tryAuth, getProjectById);

// PUT /api/projects/:id
// עדכון פרויקט: בעלים או אדמין (ההרשאה הסופית בקונטרולר/לוגיקה) + העלאת קבצים
router.put(
  '/:id',
  authMiddleware,
  permit('designer', 'student', 'admin'),
  uploadProject.array('files', 10),
  updateProject
);

// DELETE /api/projects/:id
// מחיקה: בעלים או אדמין + ניקוי קבצים פיזיים + מחיקת תגובות/חישוב דירוגים
router.delete('/:id', authMiddleware, permit('student', 'designer', 'admin'), deleteProject);

module.exports = router;
