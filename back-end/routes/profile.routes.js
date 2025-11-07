const express = require('express');
const { getMyProfile, updateMyProfile } = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadProfile } = require('../middleware/multer.middleware');
const { permit } = require('../middleware/role.middleware');

const router = express.Router();

// שליפת פרופיל
router.get('/me', authMiddleware, permit('admin','student','designer','customer'), getMyProfile);

// עדכון פרופיל + העלאת תמונת פרופיל
router.put('/me', authMiddleware, permit('admin','student','designer','customer'), uploadProfile.single('profileImage'), updateMyProfile);

module.exports = router;
