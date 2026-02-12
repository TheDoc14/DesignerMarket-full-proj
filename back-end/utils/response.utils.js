//back-end/utils/response.utils.js

/**
 * response.utils.js
 * פונקציות עזר ליצירת תגובות אחידות ללקוח.
 */
function ok(res, { status = 200, message = 'OK', data = null, meta = undefined } = {}) {
  const payload = { success: true, message };

  if (data !== null) payload.data = data;
  if (meta !== undefined) payload.meta = meta;

  return res.status(status).json(payload);
}

function noContent(res) {
  return res.status(204).send();
}

module.exports = { ok, noContent };
