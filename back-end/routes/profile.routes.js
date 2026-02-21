// back-end/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  deleteAccount,
  getPublicProfileWithProjects,
} = require('../controllers/profile.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { tryAuth } = require('../middleware/tryAuth.middleware');
const { uploadProfile } = require('../middleware/multer.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  userIdParam,
  updateMyProfileValidators,
  myProfileProjectsQuery,
  profileProjectsQuery,
} = require('../validators/profile.validators');
/**
 * 👤 Profile Routes
 * אחריות: פרופיל של המשתמש המחובר (me), עדכון פרופיל + תמונת פרופיל, ומחיקת משתמש (self/admin).
 *
 * הערה: מחיקה היא לפי id בפרמטר, ובקונטרולר נבדק: self או admin.
 */

// GET /api/profile/me
// שליפת פרופיל המשתמש המחובר + הפרויקטים שלו
router.get('/me', authMiddleware, myProfileProjectsQuery, validate, getMyProfile);

// PUT /api/profile/me
// עדכון פרופיל (כולל העלאת profileImage); social עובר normalize ולידציה “רכה”
router.put(
  '/me',
  authMiddleware,
  uploadProfile.single('profileImage'),
  updateMyProfileValidators,
  validate,
  updateMyProfile
);

// DELETE /api/profile/:id
// מחיקת משתמש – self או admin (כולל ניקוי קבצים + מחיקת פרויקטים/תגובות רלוונטיות)
router.delete('/:id', authMiddleware, userIdParam, validate, deleteAccount);

// GET /api/profile/:id
// שליפת פרופיל ציבורי + הפרויקטים שלו עם pagination/סינון
router.get(
  '/:id',
  tryAuth,
  userIdParam,
  profileProjectsQuery,
  validate,
  getPublicProfileWithProjects
);

module.exports = router;
