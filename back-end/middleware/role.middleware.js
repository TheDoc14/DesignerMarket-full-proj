/**
 * Middleware לבדיקת הרשאות לפי תפקיד המשתמש
 * @param  {...string} allowedRoles – רשימת תפקידים מורשים
 */
const permit = (...allowedRoles) => {
  return (req, res, next) => {
    const { user } = req;

    // אם אין משתמש בכלל (לא התחבר או JWT לא תקין)
    if (!user) return next(new Error('Unauthorized – User not authenticated'));

    // אם התפקיד לא נכלל ברשימת ההרשאות
    if (!allowedRoles.includes(user.role)) return next(new Error(`Forbidden – Access denied for role: ${user.role}`));

    next(); // הכול תקין → המשך
  };
};

module.exports = { permit };