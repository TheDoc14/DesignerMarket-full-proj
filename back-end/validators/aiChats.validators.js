// back-end/validators/aiChats.validators.js
const { body, query } = require('express-validator');
const { pageLimitQuery, orderQuery, sortByQuery, mongoIdParam } = require('./common.validators');

const AI_CHATS_SORT_FIELDS = ['createdAt', 'updatedAt', 'title'];
const AI_MESSAGES_SORT_FIELDS = ['createdAt']; // אפשר להרחיב אם יש לך שדות נוספים

// POST /api/ai-chats
const createChatValidators = [
  body('projectId').isMongoId().withMessage('Invalid projectId'),
  body('language').optional().isString().withMessage('Invalid language'),
  body('title').optional().isString().withMessage('Invalid title'),
];

// GET /api/ai-chats?projectId=&page=&limit=&sortBy=&order=
const listMyChatsValidators = [
  query('projectId').optional().isMongoId().withMessage('Invalid projectId'),
  ...pageLimitQuery,
  ...sortByQuery(AI_CHATS_SORT_FIELDS),
  ...orderQuery,
];

// /api/ai-chats/:chatId/...
const chatIdParamValidators = mongoIdParam('chatId', 'Invalid chatId');

// POST /api/ai-chats/:chatId/messages
const addMessageValidators = [
  ...chatIdParamValidators,
  body('content').trim().notEmpty().withMessage('Message content is required'),
];

// GET /api/ai-chats/:chatId/messages?page=&limit=&sortBy=&order=
const listMessagesValidators = [
  ...chatIdParamValidators,
  ...pageLimitQuery,
  ...sortByQuery(AI_MESSAGES_SORT_FIELDS),
  ...orderQuery,
];

module.exports = {
  createChatValidators,
  listMyChatsValidators,
  chatIdParamValidators,
  addMessageValidators,
  listMessagesValidators,
};
