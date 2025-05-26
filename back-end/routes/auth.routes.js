const express = require('express');
const router = express.Router();

const {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser
} = require('../controllers/auth.controller');

const { uploadApproval } = require('../middleware/multer.middleware')

// Registration – כולל קובץ תעודה אם צריך
router.post('/register', uploadApproval.single('approvalDocument'), registerUser);

// Email Verification – מהקישור שנשלח למייל
router.get('/verify-email', verifyEmail);

// Resend Email Verification - שולח מייל אימות מחדש
router.post('/resend-verification', resendVerificationEmail);

// Login – מתבצע רק לאחר אימות המייל
router.post('/login', loginUser);

module.exports = router;
