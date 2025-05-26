const express = require('express');
const { getMyProfile, updateMyProfile } = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadProfile } = require('../middleware/multer.middleware');

const router = express.Router();

// שליפת פרופיל
router.get('/me', authMiddleware, getMyProfile);

// עדכון פרופיל + העלאת תמונת פרופיל
router.put('/me', authMiddleware, uploadProfile.single('profileImage'), updateMyProfile);

module.exports = router;
