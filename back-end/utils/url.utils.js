// back-end/utils/url.utils.js
/**
 * יוטילים ליצירת URLs עקביים במערכת:
 * baseUrl יציב (PUBLIC_BASE_URL או לפי req), בניית לינקים לקבצים, והמרות בין FS path ל-URL.
 */
const path = require('path');

/**
 * getBaseUrl
 * מחזיר base URL יציב לשרת.
 * בפרודקשן משתמש ב-PUBLIC_BASE_URL כדי להימנע מבעיות reverse proxy, וב-dev נגזר מ-req.
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

/**
 * buildFileUrl
 * בונה URL ציבורי לקובץ תחת /api/files לפי segments + filename.
 * משמש בכל מקום שמחזירים לינקים לקבצים (profileImage, project media, approvalDocument וכו’).
 */
const buildFileUrl = (req, folderOrSegments, filename) => {
  const base = `${getBaseUrl(req)}/api/files`;

  const toSegments = (v) => (Array.isArray(v) ? v : [v]);
  const segments = toSegments(folderOrSegments)
    .filter(Boolean)
    .map((s) => String(s).replace(/^\/+|\/+$/g, '')); // הסרת / מיותרים מכל מקטע

  const safeName = encodeURIComponent(String(filename || ''));
  return `${base}/${segments.join('/')}/${safeName}`;
};

/**
 * uploadsPathToUrl
 * ממיר נתיב פיזי שמתחיל ב-uploads/... ל-URL ציבורי תחת /api/files/...
 * שימושי כששומרים ב-DB path פיזי ורוצים להחזיר URL לפרונט.
 */
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

/**
 * getUploadsRelativePathFromFileUrl
 * מחלץ נתיב יחסי תחת uploads מתוך URL של /api/files.
 * משמש ל-cleanup (מחיקת קובץ פיזי) בלי לשבור אם קיבלנו URL מלא/יחסי.
 */
const getUploadsRelativePathFromFileUrl = (fileUrl) => {
  try {
    if (!fileUrl || typeof fileUrl !== 'string') return '';

    let pathname = fileUrl;

    // URL מלא
    if (/^https?:\/\//i.test(fileUrl)) {
      pathname = new URL(fileUrl).pathname;
    }

    const marker = '/api/files/';
    const idx = pathname.indexOf(marker);
    if (idx === -1) return '';

    const rel = pathname.slice(idx + marker.length);
    if (!rel) return '';

    // מחזירים עם "/" כי זה path יחסי ל-uploads, ונעשה join אחר כך
    return rel.split('/').map(decodeURIComponent).join('/');
  } catch (_err) {
    // לא להפיל תהליך בגלל parse
    return '';
  }
};

// =========================
// Social URL helpers (MVP)
// =========================

/**
 * normalizeHttpUrl
 * נרמול קלט משתמש לכתובת web: אם חסר http/https — מוסיף https:// כברירת מחדל.
 * מיועד ל-social links כדי לא לדרוש מהמשתמש לדעת לכתוב פרוטוקול.
 */
const normalizeHttpUrl = (value) => {
  if (value === null || typeof value === 'undefined') return '';
  const s = String(value).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};

/**
 * isValidHttpUrl
 * בדיקה אם כתובת היא http/https תקינה.
 * מאפשר ולידציה “רכה” בפרופיל: לא מפילים עדכון, פשוט לא שומרים ערך לא תקין.
 */
const isValidHttpUrl = (value) => {
  if (!value) return true; // מאפשר ריק
  return /^https?:\/\/[^\s]+$/i.test(String(value));
};

module.exports = {
  getBaseUrl,
  buildFileUrl,
  uploadsPathToUrl,
  getUploadsRelativePathFromFileUrl,
  normalizeHttpUrl,
  isValidHttpUrl,
};
