// back-end/utils/filesCleanup.utils.js
/**
 * ניקוי קבצים פיזיים מהשרת (uploads) בצורה בטוחה ו-best-effort:
 * לא מפילים בקשה אם מחיקה נכשלת, אבל כן מונעים הצטברות קבצים ישנים.
 */
const fs = require('fs');
const path = require('path');
const { getUploadsRelativePathFromFileUrl } = require('../utils/url.utils');

/**
 * deleteUploadByFileUrl
 * מקבל URL של קובץ (או נתיב יחסי) ומנסה למחוק את הקובץ מהדיסק.
 * מיועד למחיקת תמונות פרופיל ישנות, קבצי פרויקט בעת מחיקה, ומסמכי אימות בעת מחיקת משתמש.
 */
const deleteUploadByFileUrl = (fileUrl) => {
  try {
    const rel = getUploadsRelativePathFromFileUrl(fileUrl);
    if (!rel) return false;

    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const absPath = path.join(uploadsRoot, rel);

    const resolved = path.resolve(absPath);
    const resolvedRoot = path.resolve(uploadsRoot);
    if (!resolved.startsWith(resolvedRoot)) throw new Error('Invalid file path');
    if (!fs.existsSync(resolved)) return false;

    fs.unlinkSync(resolved);
    return true;
  } catch (err) {
    if (err.message === 'Invalid file path') throw new Error('Invalid file path');
    return false;
  }
};

module.exports = { deleteUploadByFileUrl };
