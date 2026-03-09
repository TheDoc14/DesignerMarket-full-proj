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

// ----------------------------------------------------
// AI Chats Routes
// ----------------------------------------------------

// POST /api/ai-chats
// יצירת שיחת AI חדשה עבור פרויקט ששייך למשתמש המחובר
// רק משתמש עם הרשאת AI_CONSULT יכול ליצור שיחה
router.post(
  '/',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  createChatValidators,
  validate,
  createChat
);

// GET /api/ai-chats
// שליפת כל שיחות ה-AI של המשתמש המחובר
// מחזיר רק שיחות שלא סומנו כמחוקות
router.get(
  '/',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  listMyChatsValidators,
  validate,
  listMyChats
);

// GET /api/ai-chats/:chatId/messages
// שליפת כל ההודעות של שיחת AI מסוימת
// מוודא שהשיחה שייכת למשתמש המחובר
router.get(
  '/:chatId/messages',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  listMessagesValidators,
  validate,
  listChatMessages
);

// DELETE /api/ai-chats/:chatId
// מחיקה לוגית של שיחת AI
// השיחה לא נמחקת פיזית מה-DB אלא מסומנת כמחוקה
router.delete(
  '/:chatId',
  authMiddleware,
  permitPerm(PERMS.AI_CONSULT),
  chatIdParamValidators,
  validate,
  softDeleteChat
);

// POST /api/ai-chats/:chatId/messages
// שליחת הודעה חדשה ל-AI בתוך שיחה קיימת
// כולל Rate Limit + מכסה יומית + בדיקות הרשאה ובעלות
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
