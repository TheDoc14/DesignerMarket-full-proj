// back-end/routes/business.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { businessGetStats, businessGetFinance } = require('../controllers/business.controller');
const { permitPerm } = require('../middleware/rbac.middleware');
const { PERMS } = require('../constants/permissions.constants');

/**
 * 👀 Business routes (Read-only)
 * מיועד ל-Business Manager / Admin לצפייה בנתונים.
 */

router.use(authMiddleware, permitPerm(PERMS.BUSINESS_PANEL_ACCESS));

// GET /api/business/stats
// סטטיסטיקות כלליות
router.get('/stats', permitPerm(PERMS.STATS_READ), businessGetStats);

// GET /api/business/finance
// נתוני פיננסים כלליים
router.get('/finance', permitPerm(PERMS.STATS_READ), businessGetFinance);

module.exports = router;
