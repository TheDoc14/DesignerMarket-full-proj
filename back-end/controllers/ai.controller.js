//back-end/controllers/ai.controller.js
const { ok } = require('../utils/response.utils');

// AI Controller

// כרגע רק פונקציה לדיבוג, בהמשך יתווספו פונקציות שמטפלות בבקשות AI אמיתיות (לדוגמה: יצירת טקסט, תמונה וכו').
const aiPing = async (req, res) => {
  return ok(res, {
    message: 'AI module is wired',
    data: { requestId: req.requestId },
  });
};

module.exports = { aiPing };
