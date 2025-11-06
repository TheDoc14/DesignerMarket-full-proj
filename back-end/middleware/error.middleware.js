const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// נתיב לקובץ הלוגים
const LOG_PATH = path.join(__dirname, '../logs/error.log');

// יצירת תיקיית לוגים אם לא קיימת
if (!fs.existsSync(path.join(__dirname, '../logs'))) {
  fs.mkdirSync(path.join(__dirname, '../logs'));
}

/**
 * Middleware מרכזי לניהול שגיאות בכל המערכת
 * מכסה:
 * - JWT / הרשאות / Roles
 * - משתמשים / הרשמה / אימות מייל
 * - Multer / העלאות קבצים
 * - MongoDB / DB errors
 * - תקשורת / רשת
 * - בקשות שלא נמצאו
 * - שגיאות כלליות
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ [Error Caught]:', err);

  let statusCode = 500;
  let message = 'Internal Server Error';

  // ==============================
  // 🔐 אימות והרשאות
  // ==============================
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  } else if (err.message?.includes('No token provided')) {
    statusCode = 401;
    message = 'Authentication token missing.';
  } else if (err.message?.includes('Access denied')) {
    statusCode = 403;
    message = 'Access denied: insufficient permissions.';
  } else if (err.message?.includes('User not authenticated')) {
    statusCode = 401;
    message = 'User not authenticated.';
  }

  // ==============================
  // 👤 משתמשים / אימות מייל / הרשמה
  // ==============================
  else if (err.message?.includes('User already exists')) {
    statusCode = 400;
    message = 'User already exists with this email.';
  } else if (err.message?.includes('Invalid or expired token')) {
    statusCode = 400;
    message = 'Verification token invalid or expired.';
  } else if (err.message?.includes('Please verify your email')) {
    statusCode = 403;
    message = 'Email verification required.';
  } else if (err.message?.includes('Your account is pending admin approval')) {
    statusCode = 403;
    message = 'Your account is awaiting admin approval.';
  } else if (err.message?.includes('Approval document is required')) {
    statusCode = 400;
    message = 'Approval document is required for student/designer registration.';
  }

  // ==============================
  // 💾 MongoDB / Mongoose
  // ==============================
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const messages = Object.values(err.errors).map(e => e.message);
    message = `Validation Error: ${messages.join(', ')}`;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'.`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key: record already exists.';
  }

  // ==============================
  // 📤 Multer / העלאות קבצים
  // ==============================
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large. Maximum 100MB allowed for projects.';
  } else if (err.message?.includes('Unsupported file type')) {
    statusCode = 400;
    message = 'Unsupported file type. Allowed: image, video, PDF, DOCX, PPTX.';
  } else if (err.message?.includes('ENOENT')) {
    statusCode = 404;
    message = 'File not found on server.';
  }

  // ==============================
  // ⚙️ DB / תקשורת / שרת
  // ==============================
  else if (err.message?.includes('Failed to connect to DB')) {
    statusCode = 503;
    message = 'Database connection failed.';
  } else if (err.message?.includes('Network error')) {
    statusCode = 502;
    message = 'Network communication error.';
  } else if (err.message?.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Database refused connection.';
  }

  // ==============================
  // 🔍 נתונים שלא נמצאו
  // ==============================
  else if (err.message?.includes('not found')) {
    statusCode = 404;
    message = 'Requested resource not found.';
  }

  // ==============================
  // 🧩 שגיאות שרת כלליות
  // ==============================
  else if (err.message) {
    message = err.message;
  }

  // ==============================
  // 🪵 כתיבת שגיאה ללוג
  // ==============================
  const logMessage = `[${new Date().toISOString()}] [${statusCode}] ${message}
URL: ${req.originalUrl}
Method: ${req.method}
Stack: ${err.stack}\n\n`;

  fs.appendFileSync(LOG_PATH, logMessage);

  // ==============================
  // 🔁 תגובה אחידה
  // ==============================
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;