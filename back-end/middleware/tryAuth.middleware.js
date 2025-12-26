//back-end/middleware/tryAuth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * tryAuth.middleware.js
 * ניסיון “רך” לאימות משתמש: אם יש JWT תקין — מציב req.user; אם לא — ממשיך בלי להפיל.
 * מיועד לראוטים ציבוריים שרוצים לדעת מי הצופה (לדוגמה: חשיפת קבצים לבעלים/אדמין בלבד).
 */
const tryAuth = (req, res, next) => {
  const header = req.headers?.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
    } catch (_err) {
      next(); // טוקן לא תקין? מתעלמים. זה ראוט ציבורי, לא חוסמים.
    }
  }
  next();
};
module.exports = { tryAuth };
