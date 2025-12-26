// back-end/middlewares/role.middleware.js
/**
 * role.middleware.js
 * permit(...roles) מחזיר middleware שמאפשר גישה רק לתפקידים מורשים.
 * עובד תמיד אחרי authMiddleware כי הוא נשען על req.user.role.
 */
const permit = (...allowedRoles) => {
  return (req, res, next) => {
    const { user } = req;

    // אם אין משתמש בכלל (לא התחבר או JWT לא תקין)
    if (!user) return next(new Error('Unauthorized – User not authenticated'));

    // אם התפקיד לא נכלל ברשימת ההרשאות
    if (!allowedRoles.includes(user.role))
      return next(new Error(`Forbidden – Access denied for role: ${user.role}`));

    next(); // הכול תקין → המשך
  };
};

module.exports = { permit };
