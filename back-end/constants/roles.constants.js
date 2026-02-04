//back-end/constants/roles.constants.js

// Define user roles
const ROLES = Object.freeze({
  ADMIN: 'admin',
  SYSTEM_MANAGER: 'systemManager',
  STUDENT: 'student',
  DESIGNER: 'designer',
  CUSTOMER: 'customer',
});

// קבוצות הרשאה (אל תשתמש יותר ב-CREATORS בשביל projectFiles)
const ROLE_GROUPS = Object.freeze({
  //Admin only
  ADMIN_ONLY: [ROLES.ADMIN],

  // כל מי שמחובר
  ANY_AUTH: [ROLES.ADMIN, ROLES.SYSTEM_MANAGER, ROLES.STUDENT, ROLES.DESIGNER, ROLES.CUSTOMER],

  // מי שמותר לו להעלות פרויקט/להתייעץ עם AI (לפי הכללים שלכם)
  UPLOADERS: [ROLES.STUDENT, ROLES.DESIGNER],

  // מי שמותר לו לצפות בדוחות/סטטיסטיקות מערכת (System Manager + Admin)
  SYSTEM_VIEWERS: [ROLES.ADMIN, ROLES.SYSTEM_MANAGER],
});

module.exports = { ROLES, ROLE_GROUPS };
