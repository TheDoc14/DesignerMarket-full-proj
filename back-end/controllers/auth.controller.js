const User = require('../models/Users.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateVerificationToken } = require('../utils/emailToken');
const { sendVerificationEmail } = require('../utils/email');

const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 1. בדיקה אם המשתמש קיים
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 2. הצפנת סיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. יצירת טוקן אימות ושמירת המשתמש
    const verificationToken = generateVerificationToken();
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken
    });
    await user.save();

    // 4. שליחת מייל אימות
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: 'Registered successfully. Check your email for verification link.'
    });

  } catch (error) {
    console.error('registerUser error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('verifyEmail error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. חיפוש המשתמש
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 2. ודא שאימת המייל בוצע
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    // 3. השוואת סיסמה
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 4. יצירת JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
        isVerified:  user.isVerified,
      }
    });

  } catch (error) {
    console.error('loginUser error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { registerUser, verifyEmail, loginUser };
