// back-end/controllers/auth.controller.js
const User = require('../models/Users.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateVerificationToken } = require('../utils/emailToken.utils');
const { sendVerificationEmail } = require('../utils/email.utils');
const { pickUserPublic } = require('../utils/serializers.utils'); // ✔ שם קובץ נכון
const { getBaseUrl, buildFileUrl } = require('../utils/url.utils');

// ==========================
// 📩 רישום משתמש חדש (ללא שדות פרופיל חובה)
// ==========================
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // נרמול בסיסי (הסכמה כבר עושה trim; כאן רק lower-case וקושרים usernameLower)
    const trimmedUsername = (username || '').trim();
    const usernameLower = trimmedUsername.toLowerCase();
    const emailNorm = (email || '').trim().toLowerCase();
    const safeRole = ['student', 'designer', 'customer', 'admin'].includes(role) ? role : 'customer';

    // אימייל ושם משתמש ייחודיים
    const [existingByEmail, existingByUsername] = await Promise.all([
      User.findOne({ email: emailNorm }),
      User.findOne({ usernameLower }),
    ]);
    if (existingByEmail) throw new Error('User already exists');
    if (existingByUsername) throw new Error('Username already taken');

    // לסטודנט/מעצב – נדרש מסמך אישור; נשמור URL דרך קובץ ה־files API
    let approvalPath = '';
    if (safeRole === 'student' || safeRole === 'designer') {
      if (!req.file) throw new Error('Approval document is required for this role');
      approvalPath = buildFileUrl(req, 'approvalDocuments', req.file.filename);
    }

    // הצפנת סיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // טוקן אימות מייל
    const verificationToken = generateVerificationToken();

    // יצירת משתמש
    const user = new User({
      username: trimmedUsername,
      usernameLower,
      email: emailNorm,
      password: hashedPassword,
      role: safeRole,
      isVerified: false,
      isApproved: safeRole === 'customer',
      verificationToken,
      approvalDocument: approvalPath,
    });

    await user.save();
    await sendVerificationEmail(user.email, verificationToken);

    return res.status(201).json({
      message: 'Registered successfully. Check your email for verification link.',
    });
  } catch (err) { next(err); }
};

// ==========================
// ✅ אימות מייל מהקישור
// ==========================
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) throw new Error('No token provided');

    const user = await User.findOne({ verificationToken: token });
    if (!user) throw new Error('Invalid or expired token');

    user.isVerified = true;
    user.verificationToken = '';
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) { next(err); }
};

// ==========================
// 🔁 שליחת מייל אימות מחדש
// ==========================
const resendVerificationEmail = async (req, res, next) => {
  try {
    const emailNorm = (req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });
    if (!user) throw new Error('User not found');
    if (user.isVerified) throw new Error('User is already verified');

    const newToken = generateVerificationToken();
    user.verificationToken = newToken;
    await user.save();

    await sendVerificationEmail(user.email, newToken);

    return res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (err) { next(err); }
};

// ==========================
// 🔑 התחברות משתמש
// ==========================
const loginUser = async (req, res, next) => {
  try {
    const emailNorm = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    // 1) מציאת המשתמש לפי אימייל מנורמל
    const user = await User.findOne({ email: emailNorm });
    if (!user) throw new Error('Invalid credentials');

    // 2) בדיקת סיסמה
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    // 3) אימות מייל
    if (!user.isVerified) throw new Error('Please verify your email before logging in');

    // 4) אישור אדמין עבור student/designer
    if ((user.role === 'student' || user.role === 'designer') && !user.isApproved) {
      throw new Error('Your account is pending admin approval');
    }

    // 5) הנפקת JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 6) סיריאליזציה בטוחה של המשתמש
    const baseUrl = getBaseUrl(req);
    const safeUser = pickUserPublic(user, { forRole: user.role, baseUrl });

    return res.status(200).json({ token, user: safeUser });
  } catch (err) { next(err); }
};

module.exports = { registerUser, verifyEmail, resendVerificationEmail, loginUser };