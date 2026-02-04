// back-end/constants/permissions.constants.js
const PERMS = Object.freeze({
  // Panels
  ADMIN_PANEL_ACCESS: 'admin.panel.access',
  SYSTEM_PANEL_ACCESS: 'system.panel.access',

  // Users
  USERS_READ: 'users.read',
  USERS_APPROVE: 'users.approve',
  USERS_ASSIGN_ROLE: 'users.assignRole',

  // Roles (dynamic)
  ROLES_MANAGE: 'roles.manage',

  // Categories (dynamic)
  CATEGORIES_MANAGE: 'categories.manage',

  // Projects (core)
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',
  PROJECTS_PUBLISH: 'projects.publish',

  // Reviews (admin moderation)
  REVIEWS_MANAGE: 'reviews.manage',

  // Files (sensitive)
  FILES_PROJECTS_READ: 'files.projects.read',
  FILES_APPROVALDOCS_READ: 'files.approvalDocs.read',

  // Stats
  STATS_READ: 'stats.read',
});

module.exports = { PERMS };
