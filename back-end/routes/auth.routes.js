const express = require('express');
const router = express.Router();

const { registerUser, verifyEmail, loginUser } = require('../controllers/auth.controller');

// Registration – יוצר משתמש ושולח מייל אימות
router.post('/register', registerUser);

// Email Verification – מהקישור שנשלח למייל
router.get('/verify-email', verifyEmail);

// Login – מתבצע רק לאחר אימות המייל
router.post('/login', loginUser);

module.exports = router;
