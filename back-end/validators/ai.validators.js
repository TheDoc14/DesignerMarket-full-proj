// back-end/validators/ai.validators.js
const { body } = require('express-validator');
const { AI_LIMITS } = require('../constants/ai.constants');

/**
 * ✅ AI Validators
 * אחריות: ולידציה לקלט של AI לפני שהקונטרולר רץ.
 * סגנון: כמו שאר הפרויקט — express-validator arrays + validate middleware.
 */

// POST /api/ai/consult
const aiConsultValidators = [
  body('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid projectId'),

  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ max: AI_LIMITS.QUESTION_MAX_CHARS })
    .withMessage(`Question is too long (max ${AI_LIMITS.QUESTION_MAX_CHARS} chars)`),

  body('context')
    .optional()
    .isString()
    .withMessage('Context must be a string')
    .isLength({ max: AI_LIMITS.CONTEXT_MAX_CHARS })
    .withMessage(`Context is too long (max ${AI_LIMITS.CONTEXT_MAX_CHARS} chars)`),
];

module.exports = {
  aiConsultValidators,
};
