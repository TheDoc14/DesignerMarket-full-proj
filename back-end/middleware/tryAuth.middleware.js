// back-end/middleware/tryAuth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * tryAuth.middleware.js
 * ניסיון “רך” לאימות משתמש: אם יש JWT תקין — מציב req.user; אם לא — ממשיך בלי להפיל.
 * מיועד לראוטים ציבוריים שרוצים לדעת מי הצופה.
 */
const tryAuth = (req, _res, next) => {
  const header = req.headers?.authorization || '';

  // אין bearer? ממשיכים כציבורי
  if (!header.startsWith('Bearer ')) return next();

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (_err) {
    // טוקן לא תקין? מתעלמים (ציבורי)
    return next();
  }
};

module.exports = { tryAuth };
