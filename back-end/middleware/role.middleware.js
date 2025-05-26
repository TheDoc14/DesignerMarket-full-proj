/**
 * מחזיר middleware שבודק אם לתפקיד המשתמש יש גישה
 * @param  {...string} allowedRoles – רשימת תפקידים מורשים
 */
const permit = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user נוצר ב־auth.middleware
    const { user } = req;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden – Access denied' });
    }
    next();
  };
};

module.exports = { permit };
