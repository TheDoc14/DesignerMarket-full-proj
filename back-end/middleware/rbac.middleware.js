// back-end/middleware/rbac.middleware.js
const Role = require('../models/Role.model');

/**
 * RBAC (Dynamic)
 * permitPerm(...perms)   -> חייב את כולן
 * permitAnyPerm(...perms)-> מספיק אחת
 *
 * עובד אחרי authMiddleware כי נשען על req.user.role
 */

const loadRolePerms = async (roleKey) => {
  const key = String(roleKey || '').toLowerCase();
  const role = await Role.findOne({ key }).lean();
  return Array.isArray(role?.permissions) ? role.permissions : [];
};

const permitPerm = (...requiredPerms) => {
  const required = requiredPerms.flat().filter(Boolean);

  return async (req, _res, next) => {
    try {
      if (!req.user) {
        const err = new Error('Unauthorized – User not authenticated');
        err.statusCode = 401;
        throw err;
      }

      const userPerms = await loadRolePerms(req.user.role);
      const ok = required.every((p) => userPerms.includes(p));

      if (!ok) {
        const err = new Error('Forbidden – Missing permission');
        err.statusCode = 403;
        throw err;
      }

      req.user.permissions = userPerms;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

const permitAnyPerm = (...requiredPerms) => {
  const required = requiredPerms.flat().filter(Boolean);

  return async (req, _res, next) => {
    try {
      if (!req.user) {
        const err = new Error('Unauthorized – User not authenticated');
        err.statusCode = 401;
        throw err;
      }

      const userPerms = await loadRolePerms(req.user.role);
      const ok = required.some((p) => userPerms.includes(p));

      if (!ok) {
        const err = new Error('Forbidden – Missing permission');
        err.statusCode = 403;
        throw err;
      }

      req.user.permissions = userPerms;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = { permitPerm, permitAnyPerm };
