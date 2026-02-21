// back-end/middleware/captcha.middleware.js

/**
 * captcha.middleware.js
 * מאמת Google reCAPTCHA v3 לפי הטוקן שמגיע מהפרונט.
 *
 * ✅ לפי הסטנדרט אצלנו:
 * - try/catch בכל middleware אסינכרוני
 * - לא מחזירים תשובה מתוך middleware (לא res.json) — רק next(err)
 * - משתמשים ב-err.statusCode + err.expose כדי שה-errorHandler יחזיר 4xx מסודר
 *
 * איך הטוקן מגיע?
 * - Body: captchaToken
 * - או Header: x-recaptcha-token (אופציונלי)
 *
 * הערות:
 * - v3 מחזיר score (0..1). אנחנו חוסמים אם score < threshold.
 * - אפשר לבדוק action אם רוצים (recommended).
 */

const {
  deleteUploadsFromFilesArray,
  deleteUploadByFsPath,
} = require('../utils/filesCleanup.utils');

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * 🧹 cleanupUploadsBestEffort
 * אם יש upload שנשמר לפני שנכשלנו (למשל register עם approvalDocument),
 * ננקה אותו כדי שלא ישארו קבצים "יתומים".
 */
const cleanupUploadsBestEffort = async (req) => {
  try {
    // single file (multer .single)
    if (req.file?.path) {
      deleteUploadByFsPath(req.file.path);
    }

    // multiple files (multer .array / .fields)
    // אצלכם כבר יש helper שעושה best-effort
    if (Array.isArray(req.files)) {
      deleteUploadsFromFilesArray(req.files);
    } else if (req.files && typeof req.files === 'object') {
      // fields: { images: [..], docs: [..] }
      for (const key of Object.keys(req.files)) {
        if (Array.isArray(req.files[key])) deleteUploadsFromFilesArray(req.files[key]);
      }
    }
  } catch (_err) {
    // best-effort: לא מפילים את השרת בגלל cleanup
  }
};

/**
 * verifyRecaptchaV3
 * @param {string} expectedAction - למשל: 'register' | 'login' | 'forgot_password' | 'reset_password'
 */
const verifyRecaptchaV3 = (expectedAction) => {
  return async (req, _res, next) => {
    try {
      // ✅ DEV bypass (רק לפיתוח/בדיקות ידניות כשאין פרונט)
      // לעולם לא להפעיל בפרודקשן
      const bypass = process.env.RECAPTCHA_BYPASS === 'true';
      if (bypass && process.env.NODE_ENV !== 'production') {
        req.recaptcha = { bypass: true, score: 1, action: expectedAction || 'bypass' };
        return next();
      }

      const secret = process.env.RECAPTCHA_V3_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY || '';

      if (!secret) {
        const err = new Error('reCAPTCHA is not configured');
        err.statusCode = 500;
        err.expose = true;
        return next(err);
      }

      const token = (req.body && req.body.captchaToken) || req.headers['x-recaptcha-token'] || '';

      if (!token) {
        const err = new Error('Captcha token is required');
        err.statusCode = 400;
        err.expose = true;
        return next(err);
      }

      const thresholdRaw =
        process.env.RECAPTCHA_V3_MIN_SCORE || process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5';
      const threshold = Number(thresholdRaw);

      // שולחים ל-Google
      const body = new URLSearchParams({
        secret,
        response: token,
        // remoteip אופציונלי — לא חובה
        remoteip: req.ip,
      });

      const resp = await fetch(RECAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      let data = {};
      try {
        data = await resp.json();
      } catch (_err) {
        data = {};
      }

      // אם Google לא ענה תקין — מבחינתנו זה כשל רשת/שירות
      if (!resp.ok) {
        const err = new Error('reCAPTCHA verification failed (network)');
        err.statusCode = 502;
        err.expose = true;
        await cleanupUploadsBestEffort(req);
        return next(err);
      }

      const success = data && data.success === true;
      const score = typeof data.score === 'number' ? data.score : 0;
      const action = typeof data.action === 'string' ? data.action : '';

      const scoreOk = Number.isFinite(threshold) ? score >= threshold : true;

      // בדיקת action — ב-v3 מומלץ
      // אם expectedAction לא הוגדר — לא בודקים
      // אם Google לא החזיר action (נדיר) — לא נחסום על זה לבד
      const actionOk =
        !expectedAction || !action
          ? true
          : String(action).toLowerCase() === String(expectedAction).toLowerCase();
      if (!success || !scoreOk || !actionOk) {
        await cleanupUploadsBestEffort(req);

        const err = new Error('Captcha verification failed');
        err.statusCode = 403;
        err.expose = true;

        // לא חושפים החוצה — רק לדיבאג פנימי (ב-dev תראה stack/log)
        err.recaptcha = { success, score, threshold, action, expectedAction };

        return next(err);
      }

      // שמירה לשימוש עתידי (לא חובה)
      req.recaptcha = { success, score, action };
      return next();
    } catch (err) {
      // 🧹 cleanup אם כבר העלינו קבצים
      await cleanupUploadsBestEffort(req);

      // עטיפה לסטטוס ידידותי
      if (!err.statusCode) err.statusCode = 500;
      if (typeof err.expose !== 'boolean') err.expose = true;

      return next(err);
    }
  };
};

module.exports = { verifyRecaptchaV3 };
