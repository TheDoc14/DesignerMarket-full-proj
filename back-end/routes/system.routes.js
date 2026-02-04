// back-end/routes/system.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { systemGetStats, systemGetFinance } = require('../controllers/system.controller');
const { permitPerm } = require('../middleware/rbac.middleware');
const { PERMS } = require('../constants/permissions.constants');

/**
 * 👀 System routes (Read-only)
 * מיועד ל-System Manager / Admin לצפייה בנתונים.
 */

router.use(authMiddleware, permitPerm(PERMS.SYSTEM_PANEL_ACCESS));

// GET /api/system/stats-
// סטטיסטיקות כלליות
router.get('/stats', permitPerm(PERMS.STATS_READ), systemGetStats);

// GET /api/system/finance
// נתוני פיננסים כלליים
router.get('/finance', permitPerm(PERMS.STATS_READ), systemGetFinance);

module.exports = router;
