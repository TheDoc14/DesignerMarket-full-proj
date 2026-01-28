// back-end/middlewares/role.middleware.js
/**
 * role.middleware.js
 * permit(...roles) מחזיר middleware שמאפשר גישה רק לתפקידים מורשים.
 * עובד תמיד אחרי authMiddleware כי הוא נשען על req.user.role.
 */
const permit = (...allowedRoles) => {
  const roles = allowedRoles.flat(); // ✅ מאפשר permit(ROLE_GROUPS.CREATORS)

  return (req, _res, next) => {
    const { user } = req;
    if (!user) return next(new Error('Unauthorized – User not authenticated'));
    if (!roles.includes(user.role))
      return next(new Error(`Forbidden – Access denied for role: ${user.role}`));
    return next();
  };
};

module.exports = { permit };
