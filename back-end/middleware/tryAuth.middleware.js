//back-end/middleware/tryAuth.middleware.js
const jwt = require('jsonwebtoken');

const tryAuth = (req, res, next) => {
  const header = req.headers?.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
    } catch (e) {
      // טוקן לא תקין? מתעלמים. זה ראוט ציבורי, לא חוסמים.
    }
  }
  next();
};
module.exports={tryAuth};