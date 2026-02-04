// back-end/utils/bootstrapRbac.utils.js
const Role = require('../models/Role.model');
const { PERMS } = require('../constants/permissions.constants');
const { ROLES } = require('../constants/roles.constants');

/**
 * Creates/updates base roles in DB.
 * Safe to run on every server start.
 */
const ensureBaseRoles = async () => {
  const base = [
    {
      key: ROLES.ADMIN,
      label: 'Admin',
      isSystem: true,
      permissions: [
        PERMS.ADMIN_PANEL_ACCESS,
        PERMS.USERS_READ,
        PERMS.USERS_APPROVE,
        PERMS.USERS_ASSIGN_ROLE,
        PERMS.ROLES_MANAGE,
        PERMS.CATEGORIES_MANAGE,
        PERMS.PROJECTS_PUBLISH,
        PERMS.REVIEWS_MANAGE,
        PERMS.STATS_READ,

        // (לא חובה, אבל לרוב אדמין יכול לעשות הכול)
        PERMS.PROJECTS_CREATE,
        PERMS.PROJECTS_UPDATE,
        PERMS.PROJECTS_DELETE,
        PERMS.FILES_PROJECTS_READ,
        PERMS.FILES_APPROVALDOCS_READ,
      ],
    },

    {
      key: ROLES.SYSTEM_MANAGER,
      label: 'System Manager',
      isSystem: true,
      permissions: [
        PERMS.SYSTEM_PANEL_ACCESS,
        PERMS.STATS_READ,
        // שים לב: אין לו ADMIN_PANEL_ACCESS ואין לו ניהול משתמשים/roles/categories
      ],
    },

    // יצירה/עריכה/מחיקה — עדיין נשלטת בקונטרולר לפי owner,
    // אבל ההרשאה עצמה (גישה לראוט) עוברת דרך RBAC.
    {
      key: ROLES.STUDENT,
      label: 'Student',
      isSystem: true,
      permissions: [
        PERMS.PROJECTS_CREATE,
        PERMS.PROJECTS_UPDATE,
        PERMS.PROJECTS_DELETE,
        PERMS.FILES_PROJECTS_READ,
      ],
    },
    {
      key: ROLES.DESIGNER,
      label: 'Designer',
      isSystem: true,
      permissions: [
        PERMS.PROJECTS_CREATE,
        PERMS.PROJECTS_UPDATE,
        PERMS.PROJECTS_DELETE,
        PERMS.FILES_PROJECTS_READ,
      ],
    },
    {
      key: ROLES.CUSTOMER,
      label: 'Customer',
      isSystem: true,
      permissions: [PERMS.FILES_PROJECTS_READ],
    },
  ];

  for (const r of base) {
    await Role.findOneAndUpdate(
      { key: r.key },
      { $set: { label: r.label, permissions: r.permissions, isSystem: r.isSystem } },
      { upsert: true, new: true }
    );
  }
};

module.exports = { ensureBaseRoles };
