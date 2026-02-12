// back-end/middleware/aiRateLimit.middleware.js
/**
 * aiRateLimit.middleware.js
 * מידלוור זה מיישם הגבלת קצב (Rate Limiting) ספציפית לנתיבי ה-AI שלנו, כדי למנוע שימוש יתר או התקפות DDoS על נקודות הקצה הרגישות של ה-AI.
 * הגבלת הקצב מוגדרת ל-10 בקשות לדקה לכל IP, מה שמאפשר שימוש סביר אך מונע עומס יתר על השרת.
 * ההגדרה כוללת גם הודעת שגיאה מותאמת שתוחזר כאשר משתמש חורג מהמגבלה, כדי לספק חווית משתמש טובה יותר.
 * המידלוור משתמש בחבילת express-rate-limit הפופולרית, שמטפלת בכל הלוגיקה של ספירת הבקשות והחזרת השגיאות בצורה יעילה ואמינה.
 * ניתן להוסיף את המידלוור הזה לנתיבי ה-AI שלנו ב-server.js, כך שכל בקשה לנתיבים אלו תעבור דרך הגבלת הקצב הזו.
 */
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 429,
    message: 'Too many AI requests. Please try again soon.',
  },
});

module.exports = { aiLimiter };
