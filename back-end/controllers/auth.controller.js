// back-end/controllers/auth.controller.js
const User = require('../models/Users.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  generateVerificationToken,
  generateResetToken,
  hashToken,
} = require('../utils/emailToken.utils');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/email.utils');
const { pickUserPublic } = require('../utils/serializers.utils');
const { getBaseUrl, buildFileUrl } = require('../utils/url.utils');
const { deleteUploadByFsPath } = require('../utils/filesCleanup.utils');
const { normalizeEmail } = require('../utils/normalize.utils');
const { ROLES } = require('../constants/roles.constants');
/**
 * 📝 registerUser
 * יוצר משתמש חדש במערכת, כולל העלאת approvalDocument לסטודנט/מעצב לפי הצורך.
 * מבצע נרמול אימייל/username, הצפנת סיסמה, יצירת verificationToken ושליחת מייל אימות.
 * מחזיר משתמש מסוריאלייז + הודעה, בלי לחשוף שדות רגישים.
 */
const registerUser = async (req, res, next) => {
  try {
    // ---- בסיס: גוף הבקשה ----
    const { username, password, role } = req.body;

    // ---- נרמול בסיסי ----
    const trimmedUsername = (username || '').trim();
    const usernameLower = trimmedUsername.toLowerCase();
    const emailNorm = normalizeEmail(req.body.email);
    const allowedSelfRegisterRoles = [ROLES.STUDENT, ROLES.DESIGNER, ROLES.CUSTOMER];
    const safeRole = allowedSelfRegisterRoles.includes(role) ? role : ROLES.CUSTOMER;

    // ---- הגנה: לקוח לא אמור להעלות מסמך אישור ----
    // multer יכול לשמור את הקובץ לפני הקונטרולר, לכן מנקים כאן ומחזירים שגיאה.
    if (safeRole === ROLES.CUSTOMER && req.file && req.file.path) {
      try {
        deleteUploadByFsPath(String(req.file.path));
      } catch (_err) {}
      throw new Error('Approval document is not allowed for customers');
    }

    // ---- אימייל ושם משתמש ייחודיים ----
    const [existingByEmail, existingByUsername] = await Promise.all([
      User.findOne({ email: emailNorm }),
      User.findOne({ usernameLower }),
    ]);
    if (existingByEmail) throw new Error('User already exists');
    if (existingByUsername) throw new Error('Username already taken');

    // ---- לסטודנט/מעצב – נדרש מסמך אישור ----
    // כאן אנחנו שומרים URL (ולא fsPath) כי זה מה שנכנס למסד.
    let approvalPath = '';
    if (safeRole === ROLES.STUDENT || safeRole === ROLES.DESIGNER) {
      if (!req.file) throw new Error('Approval document is required for this role');
      approvalPath = buildFileUrl(req, 'approvalDocuments', req.file.filename);
    }

    // ---- הצפנת סיסמה ----
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ---- טוקן אימות מייל ----
    const verificationToken = generateVerificationToken();

    // ---- יצירת משתמש ----
    const user = new User({
      username: trimmedUsername,
      usernameLower,
      email: emailNorm,
      password: hashedPassword,
      role: safeRole,
      isVerified: false,
      isApproved: safeRole === ROLES.CUSTOMER, // לקוח מאושר אוטומטית
      verificationToken,
      approvalDocument: approvalPath,
    });

    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(201).json({
      message: 'Registered successfully. Check your email for verification link.',
    });
  } catch (err) {
    // ---- Cleanup: אם יש קובץ שהועלה ואז קרתה שגיאה בתהליך ההרשמה ----
    // חשוב: לא נוגעים בקבצים קיימים של משתמשים אחרים, רק במה שהועלה בבקשה הזו.
    if (req.file && req.file.path) {
      try {
        deleteUploadByFsPath(String(req.file.path));
      } catch (_err) {}
    }

    next(err);
  }
};

/**
 * ✅ verifyEmail
 * מאמת משתמש על בסיס token שמגיע מהקישור במייל.
 * בודק שהטוקן תקין ושייך למשתמש, מסמן isVerified ומנקה verificationToken.
 * לאחר אימות המשתמש יכול להתחבר (בכפוף לאישור אדמין לתפקידים רלוונטיים).
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token });
    if (!user) throw new Error('Invalid or expired token');

    user.isVerified = true;
    user.verificationToken = '';
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔁 resendVerificationEmail
 * שולח מחדש מייל אימות למשתמש קיים שעוד לא אומת.
 * מייצר token חדש, שומר אותו במסד ושולח אותו במייל.
 * נכשל אם המשתמש לא קיים או כבר מאומת.
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    const emailNorm = normalizeEmail(req.body.email);
    const user = await User.findOne({ email: emailNorm });
    if (!user) throw new Error('User not found');
    if (user.isVerified) throw new Error('User is already verified');

    const newToken = generateVerificationToken();
    user.verificationToken = newToken;
    await user.save();

    await sendVerificationEmail(user.email, newToken);

    return res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔑 loginUser
 * מבצע התחברות: אימייל+סיסמה → JWT.
 * כולל בדיקות: סיסמה נכונה, המשתמש מאומת מייל, ואם student/designer אז גם isApproved.
 * מחזיר token + user מסוריאלייז (ללא שדות רגישים).
 */
const loginUser = async (req, res, next) => {
  try {
    const emailNorm = normalizeEmail(req.body.email);
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
    if ((user.role === ROLES.STUDENT || user.role === ROLES.DESIGNER) && !user.isApproved) {
      throw new Error('Your account is pending admin approval');
    }

    // 5) הנפקת JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // 6) סיריאליזציה בטוחה של המשתמש
    const baseUrl = getBaseUrl(req);
    const safeUser = pickUserPublic(user, { forRole: user.role, baseUrl });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔁 forgotPassword
 * מקבל אימייל ושולח לינק לאיפוס סיסמה (אם המשתמש קיים במערכת).
 * מחזיר תמיד הודעה גנרית (גם אם האימייל לא קיים) כדי לא לחשוף האם משתמש קיים (anti user-enumeration).
 * יוצר reset token חד־פעמי, שומר במסד hash + תוקף (expiresAt), ושולח מייל עם קישור לאיפוס.
 * מיועד למסך "Forgot Password" בפרונט.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const emailNorm = normalizeEmail(req.body.email);

    // תמיד נחזיר אותה תשובה בסוף
    const genericMsg = 'If the email exists in our system, we will send a password reset link.';

    if (!emailNorm) {
      return res.status(200).json({ message: genericMsg });
    }

    const user = await User.findOne({ email: emailNorm });

    // אם אין משתמש — לא חושפים. פשוט מחזירים הודעה גנרית.
    if (!user) {
      return res.status(200).json({ message: genericMsg });
    }

    // (אופציונלי) אם תרצו: רק משתמשים מאומתים יכולים לאפס
    // אם אתם רוצים להשאיר פשוט: תאפשרו גם ללא verified
    // if (!user.isVerified) return res.status(200).json({ message: genericMsg });

    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);

    const ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MIN || 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    await sendResetPasswordEmail(user.email, rawToken);

    return res.status(200).json({ message: genericMsg });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔑 resetPassword
 * מאפס סיסמה בפועל לפי token + סיסמה חדשה.
 * מאמת שהטוקן קיים, תקין, ושלא פג תוקף (expiresAt), ואז מחליף סיסמה (bcrypt) בדיוק כמו בהרשמה.
 * מנקה את הטוקן וה־expires כדי להפוך אותו לחד־פעמי (שלא יהיה ניתן להשתמש שוב).
 * מחזיר הודעת הצלחה בלבד.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) throw new Error('Invalid or expired token');

    // להצפין סיסמה בדיוק כמו register
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(newPassword), salt);

    user.password = hashedPassword;

    // חד-פעמי: לנקות כדי שהטוקן לא יהיה שמיש שוב
    user.resetPasswordTokenHash = '';
    user.resetPasswordExpiresAt = null;

    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  resetPassword,
  forgotPassword,
};
