// back-end/utils/normalize.utils.js

// normalizeEmail - פונקציה לנירמול כתובת אימייל: הסרת רווחים והפיכת כל התווים לאותיות קטנות
const normalizeEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();

module.exports = { normalizeEmail };
