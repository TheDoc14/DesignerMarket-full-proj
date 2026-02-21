// back-end/routes/file.routes.js
const express = require('express');
const router = express.Router();
const { getFile } = require('../controllers/file.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { permitPerm } = require('../middleware/rbac.middleware');
const { PERMS } = require('../constants/permissions.constants');
const { FILE_FOLDERS } = require('../constants/files.constants');
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
router.get(`/${FILE_FOLDERS.PROFILE_IMAGES}/:filename`, getFile);

// GET /api/files/projects/projectImages/:filename
// תמונות פרויקטים – פתוח
router.get(`/${FILE_FOLDERS.PROJECTS}/${FILE_FOLDERS.PROJECT_IMAGES}/:filename`, getFile);
// GET /api/files/projects/projectFiles/:filename
// קבצי פרויקטים (רגישים) – דורש JWT + תפקידים מורשים
router.get(
  `/${FILE_FOLDERS.PROJECTS}/${FILE_FOLDERS.PROJECT_FILES}/:filename`,
  authMiddleware,
  permitPerm(PERMS.FILES_PROJECTS_READ),
  getFile
);

// GET /api/files/approvalDocuments/:filename
// מסמכי אימות (רגיש מאוד) – אדמין בלבד
router.get(
  `/${FILE_FOLDERS.APPROVAL_DOCUMENTS}/:filename`,
  authMiddleware,
  permitPerm(PERMS.FILES_APPROVALDOCS_READ),
  getFile
);

module.exports = router;
