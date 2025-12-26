//back-end/utils/query.utils.js
/**
 * יוטילים לפגינציה/מיון/חיפוש כדי לא לשכפל קוד בין controllers.
 * משמש ב-admin/reviews (ובהמשך גם בפרויקטים) כדי לשמור עקביות וקריאות.
 */

/**
 * toInt
 * ממיר פרמטרים מה-query למספר חיובי, עם ברירת מחדל אם הקלט לא תקין.
 * מגן מפני page/limit לא חוקיים ומונע התנהגות לא צפויה.
 */
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

/**
 * escapeRegex
 * בורח תווים מיוחדים כדי להשתמש בבטחה ב-RegExp בחיפוש טקסטואלי.
 * מגן מפני regex injection ושומר חיפוש יציב.
 */
const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * toSort
 * מייצר אובייקט sort של Mongo לפי שדות מותרים בלבד.
 * מונע מיון לפי שדות לא מאושרים ומוריד סיכון לחשיפת מידע/באגים.
 */
const toSort = (sortBy, order, allowedFields, defaultField = 'createdAt') => {
  const field = (allowedFields || []).includes(sortBy) ? sortBy : defaultField;
  const dir = order === 'asc' || order === 'ASC' ? 1 : -1;
  return { [field]: dir };
};

module.exports = { toInt, escapeRegex, toSort };
