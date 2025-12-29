// back-end/utils/filesCleanup.utils.js
/**
 * ניקוי קבצים פיזיים מהשרת (uploads) בצורה בטוחה ו-best-effort:
 * לא מפילים בקשה אם מחיקה נכשלת, אבל כן מונעים הצטברות קבצים ישנים.
 */
const fs = require('fs');
const path = require('path');
const { getUploadsRelativePathFromFileUrl } = require('../utils/url.utils');

const uploadsRoot = path.join(process.cwd(), 'uploads');

const isInsideUploads = (absPath) => {
  const resolved = path.resolve(absPath);
  const resolvedRoot = path.resolve(uploadsRoot);
  return resolved.startsWith(resolvedRoot);
};

/**
 * 🧹 מוחק קובץ לפי URL ציבורי של המערכת (/api/files/..)
 * מיועד למחיקות “אמיתיות” (משתמש/פרויקט/תמונה ישנה).
 */
const deleteUploadByFileUrl = (fileUrl) => {
  try {
    const rel = getUploadsRelativePathFromFileUrl(fileUrl);
    if (!rel) return false;

    const absPath = path.join(uploadsRoot, rel);
    if (!isInsideUploads(absPath)) throw new Error('Invalid file path');
    if (!fs.existsSync(absPath)) return false;

    fs.unlinkSync(absPath);
    return true;
  } catch (err) {
    if (err.message === 'Invalid file path') throw new Error('Invalid file path');
    return false; // best-effort
  }
};

/**
 * 🧹 מוחק קובץ לפי נתיב דיסק (multer נותן file.path)
 * מיועד לניקוי במקרי שגיאה ב-create/update כדי שלא יישארו קבצים אחרי throw.
 */
const deleteUploadByFsPath = (fsPath) => {
  try {
    if (!fsPath) return false;

    // multer לפעמים מחזיר נתיב יחסי ("uploads/..") ולפעמים אבסולוטי
    const absPath = path.isAbsolute(fsPath) ? fsPath : path.join(process.cwd(), fsPath);

    if (!isInsideUploads(absPath)) throw new Error('Invalid file path');
    if (!fs.existsSync(absPath)) return false;

    fs.unlinkSync(absPath);
    return true;
  } catch (err) {
    if (err.message === 'Invalid file path') throw new Error('Invalid file path');
    return false; // best-effort
  }
};

/**
 * 🧹 מוחק הרבה קבצים לפי req.files (מוחק לפי file.path)
 * לא תלוי ב-multer, רק מצפה ל-array של אובייקטים עם path.
 */
const deleteUploadsFromFilesArray = (files) => {
  try {
    const arr = Array.isArray(files) ? files : [];
    for (const f of arr) {
      if (f && f.path) {
        try {
          deleteUploadByFsPath(String(f.path));
        } catch (_err) {}
      }
    }
    return true;
  } catch (_err) {
    return false;
  }
};

module.exports = {
  deleteUploadByFileUrl,
  deleteUploadByFsPath,
  deleteUploadsFromFilesArray,
};
