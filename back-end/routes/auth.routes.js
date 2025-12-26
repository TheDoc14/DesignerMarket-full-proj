//back-end/routes/auth.routes
const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
} = require('../controllers/auth.controller');
const { uploadApproval } = require('../middleware/multer.middleware');

/**
 * 🔐 Auth Routes
 * אחריות: הרשמה, אימות מייל, שליחה חוזרת של אימות, התחברות.
 * הערה: הרשמה תומכת בהעלאת approvalDocument לסטודנט/מעצב (multer).
 */

// POST /api/auth/register
// הרשמה למערכת (כולל העלאת approvalDocument אם רלוונטי לתפקיד)
router.post('/register', uploadApproval.single('approvalDocument'), registerUser);

// GET /api/auth/verify-email?token=...
// אימות מייל מתוך הקישור שנשלח למשתמש
router.get('/verify-email', verifyEmail);

// POST /api/auth/resend-verification
// שליחה מחדש של מייל אימות (למשתמש קיים שעוד לא אומת)
router.post('/resend-verification', resendVerificationEmail);

// POST /api/auth/login
// התחברות (נכשל אם המשתמש לא verified / או pending approval לתפקידים מסוימים)
router.post('/login', loginUser);

module.exports = router;
