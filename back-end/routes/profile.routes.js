const express = require('express');
const { getMyProfile, updateMyProfile } = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/multer.middleware');

const router = express.Router();

// שליפת פרופיל
router.get('/me', authMiddleware, getMyProfile);

// עדכון פרופיל + העלאת תמונת פרופיל
router.put('/me', authMiddleware, upload.single('profileImage'), updateMyProfile);

module.exports = router;
