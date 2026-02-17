//back-end/routes/aiChats.routes.js
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth.middleware');
const { permitPerm } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');

const { aiLimiter } = require('../middleware/aiRateLimit.middleware');
const { aiDailyQuota } = require('../middleware/aiDailyQuota.middleware');

const { PERMS } = require('../constants/permissions.constants');
const {
  createChatValidators,
  listMyChatsValidators,
  chatIdParamValidators,
  addMessageValidators,
  listMessagesValidators,
} = require('../validators/aiChats.validators');

const {
  createChat,
  listMyChats,
  listChatMessages,
  softDeleteChat,
  addMessageWithAI,
} = require('../controllers/aiChats.controller');

// POST /api/ai-chats
router.post(
  '/',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  createChatValidators,
  validate,
  createChat
);

// GET /api/ai-chats?projectId=&page=&limit=&sortBy=&order=.
router.get(
  '/',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  listMyChatsValidators,
  validate,
  listMyChats
);

// GET /api/ai-chats/:chatId/messages?page=&limit=&sortBy=&order=
router.get(
  '/:chatId/messages',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  listMessagesValidators,
  validate,
  listChatMessages
);

// DELETE /api/ai-chats/:chatId (soft delete)
router.delete(
  '/:chatId',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  chatIdParamValidators,
  validate,
  softDeleteChat
);

// POST /api/ai-chats/:chatId/messages
router.post(
  '/:chatId/messages',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  aiLimiter,
  aiDailyQuota,
  addMessageValidators,
  validate,
  addMessageWithAI
);

module.exports = router;
