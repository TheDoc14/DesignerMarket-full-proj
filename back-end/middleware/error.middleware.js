// back-end/middleware/error.middleware.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_PATH = path.join(LOG_DIR, 'error.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * ממפה שגיאות לסטטוס/מסר
 */
function classifyError(err) {
  // ברירת מחדל
  let statusCode = 500;
  let message = 'Internal Server Error';

  // 🛡️ JWT / הרשאות
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401; message = 'Invalid or malformed token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401; message = 'Session expired. Please log in again.';
  } else if (err.message?.includes('No token provided')) {
    statusCode = 401; message = 'Authentication token missing.';
  } else if (err.message?.includes('Access denied')) {
    statusCode = 403; message = 'Access denied: insufficient permissions.';
  } else if (err.message?.includes('User not authenticated')) {
    statusCode = 401; message = 'User not authenticated.';
  }

  // 👥 Users / Authn / Signup / Verify
  else if (err.message?.includes('Invalid credentials')) {
    statusCode = 400; message = 'Invalid credentials.';
  } else if (err.message?.includes('User already exists')) {
    statusCode = 400; message = 'User already exists with this email.';
  } else if (err.message?.includes('Username already taken')) {
    statusCode = 400; message = 'Username already taken.';
  } else if (err.message?.includes('User not found')) {
    statusCode = 404; message = 'User not found.';
  } else if (err.message?.includes('Please verify your email')) {
    statusCode = 403; message = 'Email verification required.';
  } else if (err.message?.includes('Invalid or expired token')) {
    statusCode = 400; message = 'Verification token invalid or expired.';
  } else if (err.message?.includes('Your account is pending admin approval')) {
    statusCode = 403; message = 'Your account is awaiting admin approval.';
  } else if (err.message?.includes('Approval document is required')) {
    statusCode = 400; message = 'Approval document is required for student/designer.';
  }

  // 💾 Mongo / Mongoose
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const msgs = Object.values(err.errors).map(e => e.message);
    message = `Validation Error: ${msgs.join(', ')}`;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400; message = `Invalid value for field '${err.path}'.`;
  } else if (err.code === 11000) {
    statusCode = 409; message = 'Duplicate key: record already exists.';
  }

  // 📤 Multer / העלאות קבצים
  else if (err.name === 'MulterError') {
    // דוגמאות: LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE...
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413; message = 'File too large.';
    } else {
      statusCode = 400; message = `Upload error: ${err.code || 'invalid file'}.`;
    }
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413; message = 'File too large.';
  } else if (err.message?.includes('Unsupported file type')) {
    statusCode = 400; message = 'Unsupported file type.';
  }

  // 📂 קבצים / FS
  else if (err.code === 'ENOENT' || err.message?.includes('File not found')) {
    statusCode = 404; message = 'File not found.';
  } else if (err.code === 'EACCES') {
    statusCode = 403; message = 'File access denied.';
  }

  // 🌐 תקשורת / DB infra
  else if (err.message?.includes('Failed to connect to DB')) {
    statusCode = 503; message = 'Database connection failed.';
  } else if (err.message?.includes('ECONNREFUSED')) {
    statusCode = 503; message = 'Database refused connection.';
  } else if (err.message?.includes('Network error')) {
    statusCode = 502; message = 'Network communication error.';
  }

  // 🎯 404 רך ל־not found כללי
  else if (err.message?.toLowerCase().includes('not found')) {
    statusCode = 404; /* message נשאר מ־err או ברירת־מחדל */
  }

  // אם יש סטטוס מותאם על האובייקט—נכבד אותו
  if (typeof err.statusCode === 'number') statusCode = err.statusCode;
  if (typeof err.status === 'number') statusCode = err.status;
  if (err.expose && err.message) message = err.message;

  // אם המסר המקורי יותר אינפורמטיבי (ואין חשש רגישות), נשאיר אותו
  if (err.message && message === 'Internal Server Error') {
    message = err.message;
  }

  return { statusCode, message };
}

/**
 * פורמט לוג קצר וממוקד (בלי להציף Stack בפרודקשן)
 */
function logError({ statusCode, message }, err, req) {
  const line = `[${new Date().toISOString()}] [${statusCode}] ${message} | ${req.method} ${req.originalUrl}`;
  // למסך – קצר
  if (process.env.NODE_ENV === 'development') {
    console.error('❌', line);
    if (err && err.stack) console.error(err.stack);
  } else {
    console.error('❌', line);
  }
  // לקובץ – קצר + stack
  try {
    const full = `${line}\n${err && err.stack ? err.stack : ''}\n\n`;
    fs.appendFileSync(LOG_PATH, full);
  } catch (_) { /* אל תעצור אפליקציה בגלל לוג */ }
}

const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = classifyError(err);
  logError({ statusCode, message }, err, req);

  return res.status(statusCode).json({
    success: false,
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // ← שים לב: שלוש נקודות!
  });
};

module.exports = {errorHandler};