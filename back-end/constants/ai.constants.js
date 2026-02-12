// back-end/constants/ai.constants.js
/**
 * ai.constants.js
 * קובץ זה מכיל קבועים הקשורים ליכולות ה-AI שלנו, כמו מגבלות על אורך השאלות וההקשר שנשלח ל-API של OpenAI.
 * שמנו כאן את המגבלות כדי שיהיה קל לשנות אותן בעתיד אם נרצה להרחיב את היכולות או להתאים לדרישות חדשות.
 */
const AI_LIMITS = {
  QUESTION_MAX_CHARS: 1200,
  CONTEXT_MAX_CHARS: 4000,
};

module.exports = { AI_LIMITS };
