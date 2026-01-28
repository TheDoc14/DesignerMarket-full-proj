//back-end/constants/roles.constants.js

// Define user roles
const ROLES = Object.freeze({
  ADMIN: 'admin',
  STUDENT: 'student',
  DESIGNER: 'designer',
  CUSTOMER: 'customer',
});

// Define role groups for access control
const ROLE_GROUPS = Object.freeze({
  ADMIN_ONLY: [ROLES.ADMIN],
  ANY_AUTH: [ROLES.ADMIN, ROLES.STUDENT, ROLES.DESIGNER, ROLES.CUSTOMER],
  CREATORS: [ROLES.ADMIN, ROLES.STUDENT, ROLES.DESIGNER],
  NON_CUSTOMER: [ROLES.ADMIN, ROLES.STUDENT, ROLES.DESIGNER],
});

module.exports = { ROLES, ROLE_GROUPS };
