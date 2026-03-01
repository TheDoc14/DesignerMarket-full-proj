// src/Constants/permissions.js
export const PERMISSION_LABELS = {
  'admin.panel.access': 'גישה לפאנל ניהול',
  'business.panel.access': 'צפייה בדשבורד ניהול עסקי',
  'users.read': 'צפייה ברשימת משתמשים',
  'users.approve': 'אישור/דחיית משתמשים',
  'users.assignRole': 'שינוי תפקיד למשתמש',

  'roles.manage': 'ניהול תפקידים והרשאות',
  'categories.manage': 'ניהול קטגוריות',
  'projects.create': 'יצירת פרויקט חדש',
  'projects.update': 'עדכון פרויקט',
  'projects.delete': 'מחיקת פרויקטים',

  'projects.publish': 'אישור פרסום פרויקטים',
  'reviews.manage': 'ניהול ומחיקת תגובות',
  'files.projects.read': 'צפייה בקבצי פרויקט',
  'files.approvalDocs.read': 'צפייה במסמכי אישור משתמש סטודנט ומעצב',
  'stats.read': 'צפייה בסטטיסטיקות מערכת',
  'ai.consult': 'ייעוץ בינה מלאכותית',
};

export const PERMS = {
  ADMIN_PANEL_ACCESS: 'admin.panel.access',
  BUSINESS_PANEL_ACCESS: 'business.panel.access',
  USERS_READ: 'users.read',
  USERS_APPROVE: 'users.approve',
  USERS_ASSIGN_ROLE: 'users.assignRole',
  ROLES_MANAGE: 'roles.manage',
  CATEGORIES_MANAGE: 'categories.manage',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',
  PROJECTS_PUBLISH: 'projects.publish',
  REVIEWS_MANAGE: 'reviews.manage',
  FILES_PROJECTS_READ: 'files.projects.read',
  FILES_APPROVALDOCS_READ: 'files.approvalDocs.read',
  STATS_READ: 'stats.read',
  AI_CONSULT: 'ai.consult',
};
