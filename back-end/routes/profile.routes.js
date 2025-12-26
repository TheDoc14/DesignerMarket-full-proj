// back-end/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  deleteAccount,
} = require('../controllers/profile.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadProfile } = require('../middleware/multer.middleware');
const { permit } = require('../middleware/role.middleware');

/**
 * 👤 Profile Routes
 * אחריות: פרופיל של המשתמש המחובר (me), עדכון פרופיל + תמונת פרופיל, ומחיקת משתמש (self/admin).
 *
 * הערה: מחיקה היא לפי id בפרמטר, ובקונטרולר נבדק: self או admin.
 */

// GET /api/profile/me
// שליפת פרופיל המשתמש המחובר + הפרויקטים שלו
router.get('/me', authMiddleware, permit('admin', 'student', 'designer', 'customer'), getMyProfile);

// PUT /api/profile/me
// עדכון פרופיל (כולל העלאת profileImage); social עובר normalize ולידציה “רכה”
router.put(
  '/me',
  authMiddleware,
  permit('admin', 'student', 'designer', 'customer'),
  uploadProfile.single('profileImage'),
  updateMyProfile
);

// DELETE /api/profile/:id
// מחיקת משתמש – self או admin (כולל ניקוי קבצים + מחיקת פרויקטים/תגובות רלוונטיות)
router.delete('/:id', authMiddleware, deleteAccount);

module.exports = router;
