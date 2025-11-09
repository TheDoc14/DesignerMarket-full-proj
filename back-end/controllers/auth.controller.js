const User = require('../models/Users.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateVerificationToken } = require('../utils/emailToken');
const { sendVerificationEmail } = require('../utils/email');

// ==========================
// 📩 רישום משתמש חדש
// ==========================
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // בדיקה אם המשתמש קיים
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User already exists');

    // בדיקת תפקיד – אם סטודנט/מעצב חובה קובץ
    let approvalPath = '';
    if (role === 'student' || role === 'designer') {
      if (!req.file) throw new Error('Approval document is required for this role');
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      approvalPath = `${baseUrl}/api/files/approvalDocuments/${req.file.filename}`;
    }

    // הצפנת סיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // יצירת טוקן אימות מייל
    const verificationToken = generateVerificationToken();

    // יצירת משתמש חדש
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      isApproved: role === 'customer', // לקוח מאושר אוטומטית
      verificationToken,
      approvalDocument: approvalPath
    });

    await user.save();
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({message: 'Registered successfully. Check your email for verification link.'});

  } catch (err) {next(err);}
};

// ==========================
// ✅ אימות מייל מהקישור
// ==========================
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) throw new Error('No token provided')
    const user = await User.findOne({ verificationToken: token });

    if (!user) throw new Error('Invalid or expired token');

    user.isVerified = true;
    user.verificationToken = ''; // ננקה את הטוקן
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (err) {next(err);}
};

// ==========================
// 🔁 שליחת מייל אימות מחדש
// ==========================
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) throw new Error('User not found');
    if (user.isVerified) throw new Error('User is already verified');

    const newToken = generateVerificationToken();
    user.verificationToken = newToken;
    await user.save();

    await sendVerificationEmail(user.email, newToken);

    res.status(200).json({ message: 'Verification email resent successfully' });

  } catch (err) {next(err);}
};

// ==========================
// 🔑 התחברות משתמש
// ==========================
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. חיפוש המשתמש
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    // 2. השוואת סיסמה
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    // 3. ודא שהמייל אומת
    if (!user.isVerified) throw new Error('Please verify your email before logging in');

    // 4. בדוק אם המשתמש מאושר (אם סטודנט/מעצב)
    if ((user.role === 'student' || user.role === 'designer') && !user.isApproved) {
      throw new Error('Your account is pending admin approval');
    }

    // 5. יצירת טוקן
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isApproved: user.isApproved,
        profileImage: user.profileImage
      }
    });

  } catch (err) {next(err);}
};

module.exports = { registerUser, verifyEmail, resendVerificationEmail, loginUser };