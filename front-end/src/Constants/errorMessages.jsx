// src/Constants/errorMessages.js

export const ERROR_TRANSLATIONS = {
  // === אימות והתחברות (Auth & JWT) ===
  'Captcha token is required': 'נא לאמת שאינך רובוט (Captcha).',
  'Username is required': 'שם משתמש הוא שדה חובה.',
  'Username must be between 3 and 20 characters':
    'שם המשתמש חייב להכיל בין 3 ל-20 תווים.',
  'Email is required': 'כתובת אימייל היא שדה חובה.',
  'Email is invalid': 'כתובת האימייל אינה תקינה.',
  'Password is required': 'סיסמה היא שדה חובה.',
  'Password is too short': 'הסיסמה קצרה מדי, עליה להכיל לפחות 6 תווים.',
  'Invalid role': 'סוג המשתמש שנבחר אינו תקין.',
  'Invalid or malformed token.': 'מפתח האבטחה אינו תקין, אנא התחברו מחדש.',
  'Session expired. Please log in again.': 'החיבור פג תוקף, אנא התחברו שוב.',
  'Authentication token missing.': 'חסר מפתח התחברות.',
  'User not authenticated.': 'משתמש לא מחובר.',
  'Email verification required.': 'יש לאמת את כתובת האימייל כדי להמשיך.',
  'Verification token invalid or expired.':
    'קוד האימות אינו תקין או שפג תוקפו.',
  'Your account is awaiting admin approval.': 'חשבונך ממתין לאישור מנהל מערכת.',
  'User is already verified.': 'המשתמש כבר מאומת במערכת.',

  // === ניהול תפקידים (RBAC) ===
  'Role already exists.': 'תפקיד זה כבר קיים במערכת.',
  'Cannot delete role that is assigned to users.':
    'לא ניתן למחוק תפקיד שמשויך למשתמשים.',
  'Cannot delete system role.': 'לא ניתן למחוק תפקיד מערכת מובנה.',
  'Role not found.': 'התפקיד לא נמצא.',

  // === קטגוריות (Categories) ===
  'Category already exists.': 'קטגוריה זו כבר קיימת.',
  'Category not found.': 'הקטגוריה לא נמצאה.',
  'key must be lowercase slug: a-z 0-9':
    'קטגוריה נדרשת להיות באנגלית ובמספרים בלבד',
  'Cannot update system category.': 'לא ניתן לעדכן קטגוריית מערכת.',
  'Cannot delete system category.': 'לא ניתן למחוק קטגוריית מערכת.',
  'Cannot delete category that is used by projects.':
    'לא ניתן למחוק קטגוריה שמשוייכת לפרויקטים קיימים.',

  // === פרופיל ורישום (Profile & Signup) ===
  'Invalid credentials.': 'שם משתמש או סיסמה שגויים.',
  'User already exists with this email.': 'כבר קיים משתמש עם כתובת אימייל זו.',
  'Username already taken.': 'שם המשתמש כבר תפוס, נסה שם אחר.',
  'Approval document is required for student/designer.':
    'יש להעלות מסמך אישור עבור סטודנט או מעצב.',
  'Approval document is not allowed for customers.':
    'לקוח אינו יכול להעלות מסמך אישור.',
  'User not found.': 'משתמש לא נמצא.',
  'Invalid birthDate format (expected ISO date).':
    'פורמט תאריך הלידה אינו תקין.',

  // === פרויקטים וקבצים (Projects & Files) ===
  'Project not found.': 'הפרויקט לא נמצא.',
  'Project ID is required.': 'מזהה פרויקט הוא שדה חובה.',
  'No files uploaded.': 'לא הועלו קבצים.',
  'Main file must be an image.': 'הקובץ הראשי חייב להיות תמונה.',
  'Invalid mainImageIndex.': 'מיקום התמונה הראשית אינו תקין.',
  'Unsupported file type.': 'סוג הקובץ אינו נתמך.',
  'File too large.': 'הקובץ גדול מדי (עד 5MB).',
  'Too many files uploaded.': 'העלית יותר מדי קבצים בבת אחת.',

  // === הזמנות ותשלומים (Orders & PayPal) ===
  'Order not found.': 'ההזמנה לא נמצאה.',
  'Order already processed.': 'הזמנה זו כבר עובדה.',
  'You already have a pending order for this project.':
    'כבר קיימת לך הזמנה ממתינה לפרויקט זה.',
  'Order was canceled.': 'ההזמנה בוטלה.',
  'Invalid order state.': 'מצב הזמנה לא תקין.',
  'You cannot purchase your own project.': 'לא ניתן לרכוש פרויקט של עצמך.',
  'Seller PayPal email is missing.':
    'חסר חשבון PayPal של המוכר, לא ניתן להשלים רכישה.',
  'PayPal email is required before creating a project.':
    'עליך להגדיר חשבון PayPal בפרופיל לפני יצירת פרויקט.',
  'Payment service misconfigured.': 'שגיאת הגדרה בשירות התשלומים, פנה לתמיכה.',
  'Payment provider authentication failed.': 'תקשורת נכשלה מול ספק התשלומים.',
  'Payment provider error (create order failed).':
    'שגיאה ביצירת תשלום מול PayPal.',
  'Payment provider error (capture failed).': 'שגיאה באישור התשלום הסופי.',
  'Missing PayPal order id.': 'חסר מזהה הזמנה של PayPal.',

  // === שגיאות בסיס נתונים ותשתית (Infra) ===
  'Database connection failed.': 'שגיאה בחיבור לבסיס הנתונים.',
  'Database refused connection.': 'החיבור לבסיס הנתונים נדחה.',
  'Network communication error.': 'שגיאת תקשורת ברשת.',
  'Resource not found.': 'המשאב המבוקש לא נמצא.',
  'Duplicate key: record already exists.': 'המידע כבר קיים במערכת (כפילות).',
  'Invalid value for field': 'ערך לא תקין בשדה שנשלח.',

  // --- Access / Permissions ---
  Forbidden: 'אין לך הרשאה לבצע פעולה זו.',
  'Access denied.': 'אין לך הרשאה לבצע פעולה זו.',
  'Not authorized': 'אין הרשאה. התחבר מחדש.',
  'Token expired': 'פג תוקף ההתחברות. התחבר מחדש.',

  // --- Captcha ---
  'Captcha verification failed.': 'אימות Captcha נכשל. נסה שוב.',
  'Captcha score too low.': 'אימות Captcha נכשל (ציון נמוך). נסה שוב.',

  // --- Routes ---
  'Route not found': 'הנתיב המבוקש לא נמצא בשרת.',

  // === כללי ===
  'Internal Server Error': 'אירעה שגיאה פנימית בשרת, אנא נסו שוב מאוחר יותר.',
  'Access denied: insufficient permissions.':
    'אין לך הרשאות מתאימות לביצוע פעולה זו.',
  'Invalid request.': 'בקשה לא תקינה.',
};

/**
 * פונקציה המחזירה תרגום ידידותי להודעות השגיאה מהשרת
 */
export const getFriendlyError = (serverMsg, fallback = null) => {
  // 0) אם הגיע כבר בעברית
  if (typeof serverMsg === 'string' && /[\u0590-\u05FF]/.test(serverMsg))
    return serverMsg;

  // 1) אם אין הודעה מהשרת (Network / CORS / timeout)
  if (!serverMsg) {
    return (
      fallback ||
      'לא הצלחנו להתחבר לשרת. בדוק חיבור אינטרנט / כתובת API / חסימת CORS.'
    );
  }

  // 2) התאמה מדויקת
  if (ERROR_TRANSLATIONS[serverMsg]) return ERROR_TRANSLATIONS[serverMsg];

  // 3) התאמה חלקית (כולל הבדלי רישיות)
  const translationKey = Object.keys(ERROR_TRANSLATIONS).find((key) =>
    serverMsg.toLowerCase().includes(key.toLowerCase())
  );
  if (translationKey) return ERROR_TRANSLATIONS[translationKey];

  // 4) שגיאות נפוצות בפרודקשן שלא תמיד מגיעות אותו דבר
  const lower = serverMsg.toLowerCase();

  if (lower.includes('cors'))
    return 'נחסמה גישה לשרת (CORS). ודא שהדומיין של הפרונט מאושר בבאק.';
  if (lower.includes('network error'))
    return 'שגיאת רשת. ודא שהשרת פעיל ושהכתובת נכונה.';
  if (lower.includes('timeout'))
    return 'הבקשה לשרת לקחה יותר מדי זמן. נסה שוב בעוד רגע.';
  if (lower.includes('route not found') || lower.includes('not found'))
    return 'הנתיב המבוקש לא נמצא בשרת.';
  if (lower.includes('captcha') && lower.includes('hostname'))
    return 'תקלה באימות Captcha: הדומיין לא תואם. בדוק RECAPTCHA_HOSTNAME בשרת.';
  if (lower.includes('captcha') && lower.includes('score'))
    return 'אימות Captcha נכשל (ציון נמוך). נסה שוב.';

  // 5) Mongoose / Validation
  if (serverMsg.includes('Validation Error:') || lower.includes('validation')) {
    return 'חלק מהנתונים שהוזנו אינם תקינים, אנא בדקו את הטופס.';
  }

  return fallback || 'חלה שגיאה בעיבוד הבקשה. אנא נסו שנית.';
};
