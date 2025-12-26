// back-end/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * auth.middleware.js
 * מאמת JWT ומכניס req.user (id, role) לשימוש בקונטרולרים.
 * אם אין טוקן/טוקן לא תקין — זורק שגיאה שמטופלת ע"י errorHandler.
 */
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw new Error('No token provided');

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(err);
  }
};
module.exports = { authMiddleware };
