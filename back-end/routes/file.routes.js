// routes/file.routes.js
const express = require('express');
const { getFile } = require('../controllers/file.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * גישה מבוקרת לקבצים
 * - תמונות פרופיל ופרויקטים נגישים למשתמשים רשומים
 * - מסמכי אימות (approvalDocuments) נגישים רק לאדמין
 * - כל הגישה דורשת אימות JWT
 */
router.get('/:folder/:filename', auth, getFile);

module.exports = router;
