// back-end/utils/url.utils.js
const path = require('path');

/** מחזיר base URL יציב.
 * עדיפות ל-PUBLIC_BASE_URL (פרודקשן), אחרת גוזר מהבקשה (localhost).
 */
const getBaseUrl = (req) => {
  const fromEnv = process.env.PUBLIC_BASE_URL;
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/$/, ''); // הסרת / בסוף אם קיים
  }
  return `${req.protocol}://${req.get('host')}`; // למשל http://localhost:5000
};

/** ממיר backslashes ל-slashes כדי לתמוך ב-Windows/Posix */
const toPosix = (p) => (typeof p === 'string' ? p.replace(/\\/g, '/') : '');

/** בונה URL ציבורי לקובץ מתוך שם תיקייה ושם קובץ */
const buildFileUrl = (req, folderOrSegments, filename) => {
  const base = `${getBaseUrl(req)}/api/files`;

  const toSegments = (v) => Array.isArray(v) ? v : [v];
  const segments = toSegments(folderOrSegments)
    .filter(Boolean)
    .map(s => String(s).replace(/^\/+|\/+$/g, '')); // הסרת / מיותרים מכל מקטע

  const safeName = encodeURIComponent(String(filename || ''));
  return `${base}/${segments.join('/')}/${safeName}`;
};

/** ממיר נתיב קובץ שנשמר ב-disk (מתחיל מ-uploads/...) ל-URL ציבורי תחת /api/files/... */
const uploadsPathToUrl = (req, fsPath) => {
  if (!fsPath) return '';
  const p = toPosix(fsPath);
  // מחפש את החלק שמתחיל אחרי "uploads/"
  const marker = '/uploads/';
  const idx = p.lastIndexOf(marker);
  if (idx === -1) return ''; // לא מזהה כתובת מתוך uploads - מחזיר ריק
  const relative = p.slice(idx + marker.length); // לדוגמה: 'profileImages/123.jpg' או 'projects/projectImages/abc.png'
  // מקודד כל סגמנט בנפרד
  const encoded = relative
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `${getBaseUrl(req)}/api/files/${encoded}`;
};

module.exports = { getBaseUrl, buildFileUrl, uploadsPathToUrl };