//back-end/middleware/aiDailyQuota.middleware.js
const { countAiCallsToday, getDailyLimit } = require('../services/ai/aiQuota.service');

async function aiDailyQuota(req, _res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const limit = getDailyLimit();
    const used = await countAiCallsToday(userId);

    if (used >= limit) throw new Error('Daily AI limit reached');
    req.aiQuota = { limit, used, remaining: Math.max(0, limit - used) };
    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = { aiDailyQuota };
