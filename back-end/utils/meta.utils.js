// back-end/utils/meta.utils.js

/**
 * meta.utils.js
 * יוטיל לבניית metadata אחיד לרשימות עם פגינציה.
 * מאפשר לפרונט לדעת total/pages/hasNext/hasPrev בלי לנחש.
 */

/**
 * buildMeta
 * מחשב נתוני פגינציה עבור רשימה.
 * מקבל total (כמה יש בסה"כ), page (עמוד נוכחי), limit (כמה בעמוד),
 * ומחזיר אובייקט meta אחיד לשימוש בכל ה-controllers.
 */
const buildMeta = (total, page, limit) => {
  const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const pages = Math.max(1, Math.ceil(safeTotal / safeLimit));

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    pages,
    hasNext: safePage < pages,
    hasPrev: safePage > 1,
  };
};

module.exports = { buildMeta };
