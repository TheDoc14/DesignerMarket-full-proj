// back-end/routes/file.routes.js
const express = require('express');
const router = express.Router();
const { getFile } = require('../controllers/file.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');

/**
 * 📂 Files Routes
 * אחריות: חשיפה מבוקרת של קבצים מתוך uploads דרך /api/files/...
 *
 * כללים:
 * - profileImages + projectImages: פתוח לציבור (לצפייה).
 * - projectFiles: דורש התחברות + הרשאות (admin/designer/student), ובקונטרולר גם בדיקת בעלות.
 * - approvalDocuments: אדמין בלבד.
 */

// GET /api/files/profileImages/:filename
// תמונות פרופיל – פתוח
router.get('/profileImages/:filename', getFile);

// GET /api/files/projects/projectImages/:filename
// תמונות פרויקטים – פתוח
router.get('/projects/projectImages/:filename', getFile);

// GET /api/files/projects/projectFiles/:filename
// קבצי פרויקטים (רגישים) – דורש JWT + תפקידים מורשים
router.get(
  '/projects/projectFiles/:filename',
  authMiddleware,
  permit('admin', 'designer', 'student'),
  getFile
);

// GET /api/files/approvalDocuments/:filename
// מסמכי אימות (רגיש מאוד) – אדמין בלבד
router.get('/approvalDocuments/:filename', authMiddleware, permit('admin'), getFile);

module.exports = router;
