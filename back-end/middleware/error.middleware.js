// back-end/middleware/error.middleware.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_PATH = path.join(LOG_DIR, 'error.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// helper קטן: לוקחים requestId אם קיים, ואם אין - מייצרים (fallback)
const getRequestId = (req) => {
  return req.requestId || req.headers['x-request-id'] || crypto.randomUUID();
};

/**
 * classifyError
 * ממפה שגיאות נפוצות ל־HTTP status + message אחיד.
 * המטרה: שגיאות "עסקיות" / ולידציה יחזרו 4xx ולא 500, ושגיאות מערכת יישארו 5xx.
 *
 * כללים:
 * - אל "תמציא" 500 לשגיאות בקשה – עדיף 400/401/403/404/409/413 לפי המקרה.
 * - בפרודקשן לא חושפים הודעות פנימיות ב-5xx (אבטחה).
 */
const classifyError = (err, _req, _res, _next) => {
  // ברירת מחדל
  let statusCode = 500;
  let message = 'Internal Server Error';

  const msg = typeof err?.message === 'string' ? err.message : '';
  const msgLower = msg.toLowerCase();

  // ==================================
  // ===🛡️ JWT / Auth / Permissions===
  // ==================================
  if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or malformed token.';
  } else if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  } else if (msg.includes('No token provided')) {
    statusCode = 401;
    message = 'Authentication token missing.';
  } else if (msg.includes('User not authenticated')) {
    statusCode = 401;
    message = 'User not authenticated.';
  } else if (msg.includes('Access denied') || msg.includes('Forbidden')) {
    statusCode = 403;
    message = 'Access denied: insufficient permissions.';
  }

  // =======================================
  // ===== Dynamic RBAC / Roles errors =====
  // =======================================
  else if (msg.includes('Role already exists')) {
    statusCode = 409;
    message = 'Role already exists.';
  } else if (msg.includes('Cannot delete role that is assigned to users')) {
    statusCode = 409;
    message = 'Cannot delete role that is assigned to users.';
  } else if (msg.includes('Cannot delete system role')) {
    statusCode = 400;
    message = 'Cannot delete system role.';
  } else if (msg.includes('Role not found')) {
    statusCode = 404;
    message = 'Role not found.';
  }

  // ==================================
  // ==========📚 Categories==========
  // ==================================
  else if (msg.includes('Category already exists')) {
    statusCode = 409;
    message = 'Category already exists.';
  } else if (msg.includes('Category not found')) {
    statusCode = 404;
    message = 'Category not found.';
  } else if (msg.includes('Cannot update system category')) {
    statusCode = 400;
    message = 'Cannot update system category.';
  } else if (msg.includes('Cannot delete system category')) {
    statusCode = 400;
    message = 'Cannot delete system category.';
  } else if (msg.includes('Cannot delete category in use')) {
    statusCode = 409;
    message = 'Cannot delete category that is used by projects.';
  }

  // =============================================
  // 👥 Users / Authn / Signup / Verify / Profile
  // =============================================
  else if (msg.includes('Invalid credentials')) {
    statusCode = 400;
    message = 'Invalid credentials.';
  } else if (msg.includes('User already exists')) {
    statusCode = 400;
    message = 'User already exists with this email.';
  } else if (msg.includes('Username already taken')) {
    statusCode = 400;
    message = 'Username already taken.';
  } else if (msg.includes('Please verify your email')) {
    statusCode = 403;
    message = 'Email verification required.';
  } else if (msg.includes('Invalid or expired token')) {
    statusCode = 400;
    message = 'Verification token invalid or expired.';
  } else if (msg.includes('Your account is pending admin approval')) {
    statusCode = 403;
    message = 'Your account is awaiting admin approval.';
  } else if (msg.includes('Approval document is required')) {
    statusCode = 400;
    message = 'Approval document is required for student/designer.';
  } else if (msg.includes('Approval document is not allowed for customers')) {
    // ✅ זה היה אצלך 500 בלוג — צריך להיות 400
    statusCode = 400;
    message = 'Approval document is not allowed for customers.';
  } else if (msg.includes('Invalid birthDate format')) {
    // ✅ זה היה אצלך 500 בלוג — צריך להיות 400
    statusCode = 400;
    message = 'Invalid birthDate format (expected ISO date).';
  } else if (msg.includes('User not found')) {
    statusCode = 404;
    message = 'User not found.';
  } else if (msg.includes('User is already verified')) {
    statusCode = 400;
    message = 'User is already verified.';
  }

  // =============================
  // =====🔁 Reset Password======
  // =============================
  else if (msg.includes('Reset token is required')) {
    statusCode = 400;
    message = 'Reset token is required.';
  } else if (msg.includes('New password is required')) {
    statusCode = 400;
    message = 'New password is required.';
  } else if (msg.includes('Password is too short')) {
    statusCode = 400;
    message = 'Password is too short.';
  } else if (msg.includes('Reset token invalid or expired')) {
    statusCode = 400;
    message = 'Reset token invalid or expired.';
  }

  // ========================================
  // 📦 Projects / Reviews / Business rules
  // ========================================
  else if (msg.includes('Invalid mainImageIndex')) {
    // ✅ זה היה אצלך 500 בלוג — צריך להיות 400
    statusCode = 400;
    message = 'Invalid mainImageIndex.';
  } else if (msg.includes('No files uploaded')) {
    statusCode = 400;
    message = 'No files uploaded.';
  } else if (msg.includes('Main file must be an image')) {
    statusCode = 400;
    message = 'Main file must be an image.';
  } else if (msg.includes('Price must be a valid number')) {
    statusCode = 400;
    message = 'Price must be a valid number.';
  } else if (msg.includes('Project not found')) {
    statusCode = 404;
    message = 'Project not found.';
  } else if (msg.includes('Review not found')) {
    statusCode = 404;
    message = 'Review not found.';
  } else if (msg.includes('Project ID is required')) {
    statusCode = 400;
    message = 'Project ID is required.';
  } else if (msg.includes('Rating is required')) {
    statusCode = 400;
    message = 'Rating is required.';
  }

  // ===================================
  // =========== 🤖 AI / OpenAI =========
  // ===================================
  else if (msg.includes('Daily AI limit reached')) {
    statusCode = 429;
    message = 'Daily AI limit reached.';
  } else if (msg.includes('Too many AI requests')) {
    statusCode = 429;
    message = 'Too many AI requests. Please try again soon.';
  } else if (msg.includes('OPENAI_API_KEY is missing')) {
    statusCode = 500;
    message = 'AI service is not configured.';
  } else if (msg.includes('AI request timed out')) {
    statusCode = 504;
    message = 'AI request timed out.';
  } else if (msg.includes('AI returned empty response')) {
    statusCode = 502;
    message = 'AI returned empty response.';
  } else if (
    msg.includes('You exceeded your current quota') ||
    msg.includes('insufficient_quota')
  ) {
    statusCode = 429;
    message = 'AI provider quota exceeded. Please check billing.';
  } else if (msg.includes('AI request failed')) {
    statusCode = 502;
    message = 'AI request failed.';
  } else if (msg.includes('Chat not found')) {
    statusCode = 404;
    message = 'Chat not found.';
  }

  // =================================
  // =======💳 Orders / PayPal=======
  // =================================
  /*
   * Centralized mapping of payment and order errors to stable HTTP responses.
   * This layer converts internal business and provider failures into predictable API messages,
   * which improves frontend handling, debugging, and consistency across the purchase flow.
   */
  else if (msg.includes('Order not found')) {
    statusCode = 404;
    message = 'Order not found.';
  } else if (msg.includes('Order already processed')) {
    statusCode = 409;
    message = 'Order already processed.';
  } else if (msg.includes('Order already pending for this project')) {
    statusCode = 409;
    message = 'You already have a pending order for this project.';
  } else if (msg.includes('Order is canceled')) {
    statusCode = 409;
    message = 'Order was canceled.';
  } else if (msg.includes('Invalid order state')) {
    statusCode = 409;
    message = 'Invalid order state.';
  } else if (msg.includes('Seller PayPal email missing')) {
    statusCode = 400;
    message = 'Seller PayPal email is missing.';
  } else if (msg.includes('Cannot purchase your own project')) {
    statusCode = 403;
    message = 'You cannot purchase your own project.';
  } else if (msg.includes('PayPal email is required before creating a project')) {
    statusCode = 400;
    message = 'PayPal email is required before creating a project.';
  } else if (msg.includes('PayPal credentials missing')) {
    statusCode = 500;
    message = 'Payment service misconfigured.';
  } else if (msg.includes('PayPal auth failed')) {
    statusCode = 502;
    message = 'Payment provider authentication failed.';
  } else if (msg.includes('PayPal create order failed')) {
    statusCode = 502;
    message = 'Payment provider error (create order failed).';
  } else if (msg.includes('PayPal capture failed')) {
    statusCode = 502;
    message = 'Payment provider error (capture failed).';
  } else if (msg.includes('Missing PayPal order id')) {
    statusCode = 400;
    message = 'Missing PayPal order id.';
  }

  // ==================================
  // =======💾 Mongo / Mongoose=======
  // ==================================
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const msgs = Object.values(err.errors).map((e) => e.message);
    message = `Validation Error: ${msgs.join(', ')}`;
  } else if (err instanceof mongoose.Error.CastError) {
    // לדוגמה: ObjectId לא תקין
    statusCode = 400;
    message = `Invalid value for field '${err.path}'.`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key: record already exists.';
  }

  // ===================================
  // =======📤 Multer / Uploads========
  // ===================================
  else if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File too large.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      statusCode = 400;
      message = 'Too many files uploaded.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400;
      message = 'Unexpected file field.';
    } else {
      statusCode = 400;
      message = `Upload error: ${err.code || 'invalid file'}.`;
    }
  } else if (err?.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large.';
  } else if (msg.includes('Unsupported file type')) {
    statusCode = 400;
    message = 'Unsupported file type.';
  }

  // ============================
  // =======📂 FS / Files=======
  // ============================
  else if (err?.code === 'ENOENT' || msg.includes('File not found')) {
    statusCode = 404;
    message = 'File not found.';
  } else if (err?.code === 'EACCES') {
    statusCode = 403;
    message = 'File access denied.';
  } else if (msg.includes('Invalid file path')) {
    statusCode = 400;
    message = 'Invalid file path.';
  }

  // ===================================
  // =====🌐 Infra / Network / DB======
  // ===================================
  else if (msg.includes('Failed to connect to DB')) {
    statusCode = 503;
    message = 'Database connection failed.';
  } else if (msg.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Database refused connection.';
  } else if (msg.includes('Network error')) {
    statusCode = 502;
    message = 'Network communication error.';
  }

  // ===============================
  // =====🎯 Generic fallbacks=====
  // ===============================
  else if (msg.includes('Invalid request')) {
    statusCode = 400;
    message = 'Invalid request.';
  } else if (msgLower.includes('not found')) {
    statusCode = 404;
    // message יוחלט למטה לפי כללי חשיפה
  }

  // =======================================================================
  // Respect explicit status flags (אם תחליטו להוסיף בעתיד err.statusCode)
  // =======================================================================
  if (typeof err?.statusCode === 'number') statusCode = err.statusCode;
  if (typeof err?.status === 'number') statusCode = err.status;

  // ==============================
  // ===Message exposure policy===
  // ==============================
  const isDev = process.env.NODE_ENV === 'development';

  // אם מותר לחשוף (למשל expose=true), נכבד
  if (err?.expose && msg) {
    message = msg;
  }

  // ברירת מחדל: אם זה עדיין Internal Server Error
  // - DEV: אפשר להחזיר את msg המקורי (נוח לדיבאג)
  // - PROD: לא לחשוף msg פנימי ב-5xx
  if (msg && message === 'Internal Server Error') {
    if (isDev) {
      message = msg;
    } else {
      // בפרודקשן: נחזיר msg רק אם זה 4xx (שגיאת בקשה)
      if (statusCode < 500) message = msg;
    }
  }

  // 404 בלי טקסט מפורש -> מסר כללי
  if (statusCode === 404 && (!message || message === 'Internal Server Error')) {
    message = 'Resource not found.';
  }

  return { statusCode, message };
};

/**
 * logError
 * כותב שורה קצרה למסך + קובץ לוג עם stack.
 * best-effort: לא מפיל את האפליקציה אם כתיבת הלוג נכשלת.
 */
const logError = ({ statusCode, message }, err, req) => {
  const line = `[${new Date().toISOString()}] [${statusCode}] ${message} | ${req.method} ${req.originalUrl}`;

  // למסך
  if (process.env.NODE_ENV === 'development') {
    console.error('❌', line);
    if (err?.stack) console.error(err.stack);
  } else {
    console.error('❌', line);
  }

  // לקובץ
  try {
    const full = `${line}\n${err?.stack ? err.stack : ''}\n\n`;
    fs.appendFileSync(LOG_PATH, full);
  } catch (_err) {
    // לא מפילים את האפליקציה בגלל לוג
  }
};

/**
 * errorHandler
 * middleware אחרון בשרשרת: מחזיר JSON אחיד.
 * בפרודקשן לא מחזיר stack. ב-dev מחזיר stack לדיבאג.
 */
const errorHandler = (err, req, res, _next) => {
  const { statusCode, message } = classifyError(err, req);
  logError({ statusCode, message }, err, req);
  const requestId = getRequestId(req);
  const isDev = process.env.NODE_ENV === 'development';

  const payload = {
    success: false,
    code: statusCode,
    message,
    requestId,
  };

  // details – רק אם סופק (ובד"כ רק לדיבאג/או אם תרצה לחשוף)
  if (isDev && err?.details) payload.details = err.details;

  // stack רק בדב
  if (isDev && err?.stack) payload.stack = err.stack;

  return res.status(statusCode).json(payload);
};

module.exports = { errorHandler };
