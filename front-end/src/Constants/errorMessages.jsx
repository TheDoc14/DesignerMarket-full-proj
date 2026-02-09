// src/constants/errorMessages.js

export const ERROR_TRANSLATIONS = {
  // === אימות והתחברות (Auth Validators) ===
  'Captcha token is required': 'נא לאמת שאינך רובוט (Captcha).',
  'Username is required': 'שם משתמש הוא שדה חובה.',
  'Username must be between 3 and 20 characters':
    'שם המשתמש חייב להכיל בין 3 ל-20 תווים.',
  'Email is required': 'כתובת אימייל היא שדה חובה.',
  'Email is invalid': 'כתובת האימייל אינה תקינה.',
  'Password is required': 'סיסמה היא שדה חובה.',
  'Password is too short': 'הסיסמה קצרה מדי, עליה להכיל לפחות 6 תווים.',
  'Invalid role': 'סוג המשתמש שנבחר אינו תקין.',
  'Verification token is required': 'חסר מפתח אימות אימייל.',
  'Reset token is required': 'חסר מפתח לאיפוס סיסמה.',
  'New password is required': 'יש להזין סיסמה חדשה.',

  // === ניהול אדמין (Admin Validators) ===
  'Invalid user id': 'מזהה משתמש לא תקין.',
  'Invalid project id': 'מזהה פרויקט לא תקין.',
  'role not found': 'התפקיד המבוקש לא נמצא.',
  'role must be lowercase slug: a-z 0-9 -':
    'שם התפקיד חייב להכיל אותיות קטנות, מספרים ומקפים בלבד.',
  'approved must be true or false':
    'סטטוס האישור חייב להיות "מאושר" או "ממתין".',
  'isApproved is required': 'יש לציין האם המשתמש מאושר.',
  'isApproved must be boolean': 'סטטוס האישור חייב להיות ערך בוליאני.',
  'published must be true or false':
    'סטטוס הפרסום חייב להיות "מפורסם" או "מוסתר".',
  'isPublished is required': 'יש לציין האם הפרויקט מפורסם.',
  'key is required': 'מפתח (Key) הוא שדה חובה.',
  'label too long': 'התיאור (Label) ארוך מדי (מקסימום 60 תווים).',
  'permissions must be an array': 'הרשאות חייבות להישלח כמערך.',
  'invalid permission': 'אחת ההרשאות שנבחרו אינה קיימת במערכת.',

  // === פרופיל משתמש (Profile Validators) ===
  'firstName must be a string': 'שם פרטי חייב להיות טקסט.',
  'lastName must be a string': 'שם משפחה חייב להיות טקסט.',
  'bio must be a string': 'הביוגרפיה חייבת להיות טקסט.',
  'bio is too long': 'הביוגרפיה ארוכה מדי (עד 2000 תווים).',
  'PayPal email must be a valid email': 'כתובת ה-PayPal אינה תקינה.',
  'Invalid birthDate format (expected ISO date)':
    'פורמט תאריך הלידה אינו תקין.',

  // === פרויקטים (Projects Validators) ===
  'Title is required': 'כותרת הפרויקט היא שדה חובה.',
  'Title must be between 2 and 80 characters':
    'הכותרת חייבת להכיל בין 2 ל-80 תווים.',
  'Description is too long': 'תיאור הפרויקט ארוך מדי.',
  'Price is required': 'מחיר הפרויקט הוא שדה חובה.',
  'Price must be a valid number': 'המחיר חייב להיות מספר תקין.',
  'mainImageIndex is required': 'יש לבחור תמונה ראשית לפרויקט.',
  'mainImageIndex must be a non-negative integer':
    'מזהה התמונה חייב להיות מספר חיובי.',

  // === ביקורות (Reviews Validators) ===
  'Project ID is required': 'חסר מזהה פרויקט עבור הביקורת.',
  'Rating is required': 'דירוג הוא שדה חובה.',
  'Rating must be between 1 and 5': 'הדירוג חייב להיות בין 1 ל-5 כוכבים.',
  'Text is too long': 'התגובה ארוכה מדי (עד 2000 תווים).',

  // === שגיאות כלליות ושרת (Error Middleware) ===
  'Internal Server Error': 'אירעה שגיאה בשרת, אנא נסה שוב מאוחר יותר.',
  'Invalid credentials.': 'שם משתמש או סיסמה שגויים.',
  'User already exists with this email.': 'כבר קיים משתמש עם כתובת אימייל זו.',
  'Username already taken.': 'שם המשתמש כבר תפוס, נסה שם אחר.',
  'Access denied: insufficient permissions.':
    'אין לך הרשאות מתאימות לביצוע פעולה זו.',
  'File too large.': 'הקובץ גדול מדי, הגבלה היא עד 5MB.',
};

/**
 * פונקציה המחזירה תרגום ידידותי להודעות השגיאה מהשרת
 */
export const getFriendlyError = (serverMsg) => {
  if (!serverMsg) return 'אירעה שגיאה בלתי צפויה.';

  // 1. חיפוש התאמה מדויקת
  if (ERROR_TRANSLATIONS[serverMsg]) {
    return ERROR_TRANSLATIONS[serverMsg];
  }

  // 2. חיפוש חלקי (לשגיאות עם פרמטרים משתנים)
  const translationKey = Object.keys(ERROR_TRANSLATIONS).find((key) =>
    serverMsg.includes(key)
  );

  if (translationKey) return ERROR_TRANSLATIONS[translationKey];

  // 3. אם מדובר בשגיאת ולידציה מרובה של Mongoose (Validation Error:)
  if (serverMsg.includes('Validation Error:')) {
    return 'חלק מהנתונים שהוזנו אינם תקינים, אנא בדקו את הטופס.';
  }

  // 4. אם ההודעה כבר בעברית (חלק מה-Validators שלך אולי כבר מתורגמים)
  const isHebrew = /[\u0590-\u05FF]/.test(serverMsg);
  if (isHebrew) return serverMsg;

  return 'חלה שגיאה בעיבוד הבקשה. אנא נסו שנית.';
};
