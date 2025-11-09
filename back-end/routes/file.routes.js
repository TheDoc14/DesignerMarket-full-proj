// back-end/routes/file.routes.js
const express = require('express');
const { getFile } = require('../controllers/file.controller');
const auth = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * 📂 גישה מבוקרת לקבצים
 * - תמונות פרופיל ופרויקטים: פתוחות להצגה (לא דורשות JWT)
 * - קבצי פרויקטים אמיתיים ומסמכי אימות: דורשים הרשאה
 */

// תמונות פרופיל – פתוח
router.get('/profileImages/:filename', getFile);

// תמונות פרויקטים – פתוח
router.get('/projects/projectImages/:filename', getFile);

// קבצי פרויקטים אמיתיים – דורש התחברות והרשאה
router.get('/projects/projectFiles/:filename', auth, permit('admin', 'designer', 'student'), getFile);

// מסמכי אימות – גישה רק לאדמין
router.get('/approvalDocuments/:filename', auth, permit('admin'), getFile);

module.exports = router;