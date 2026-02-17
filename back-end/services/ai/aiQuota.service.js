// back-end/services/ai/aiQuota.service.js
const AiUsageLog = require('../../models/AiUsageLog.model');

/**
 * getTodayWindow()
 * יוצר טווח זמן של "היום" לפי שעון השרת.
 * (לגרסה מתקדמת אפשר לשנות לפי timezone משתמש; כרגע מספיק.)
 */
function getTodayWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * countAiCallsToday(userId)
 * סופר כמה קריאות AI המשתמש עשה היום.
 */
async function countAiCallsToday(userId) {
  const { start, end } = getTodayWindow();

  const count = await AiUsageLog.countDocuments({
    userId,
    createdAt: { $gte: start, $lte: end },
  });

  return count;
}

/**
 * getDailyLimit()
 * קורא את המגבלה מה-ENV, ברירת מחדל 20.
 */
function getDailyLimit() {
  const n = Number(process.env.AI_DAILY_LIMIT || 20);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

module.exports = {
  countAiCallsToday,
  getDailyLimit,
};
