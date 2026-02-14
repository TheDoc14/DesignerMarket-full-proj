//back-end/routes/ai.routes.js
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth.middleware');
const { permitPerm } = require('../middleware/rbac.middleware');
const { aiLimiter } = require('../middleware/aiRateLimit.middleware');

const { PERMS } = require('../constants/permissions.constants');
const { aiPing } = require('../controllers/ai.controller');

// GET /api/ai/ping
router.get('/ping', authMiddleware, permitPerm(PERMS.AI_CONSULT), aiLimiter, aiPing);

module.exports = router;
