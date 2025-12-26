//back-end/routes/review.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const {
  createReview,
  listReviews,
  updateReview,
  deleteReview,
  getReviewById,
} = require('../controllers/review.controller');

/**
 * ⭐ Reviews Routes
 * אחריות: ביקורות לפרויקטים (create/list/update/delete).
 *
 * כללים:
 * - צפייה: ציבורי (בלי JWT).
 * - יצירה: כל משתמש מחובר.
 * - עריכה: רק יוצר התגובה.
 * - מחיקה: יוצר או אדמין (הבדיקה עצמה בקונטרולר).
 */

/// GET /api/reviews?projectId=...&page=&limit=&sortBy=&order=
// ציבורי: רשימת ביקורות לפרויקט (כולל פגינציה ומיון)
router.get('/', listReviews);

// GET /api/reviews/:id
// ציבורי: ביקורת בודדת (לשימוש עתידי/דיבאג)
router.get('/:id', getReviewById);

// POST /api/reviews
// יצירה: כל המשתמשים המחוברים
router.post('/', authMiddleware, permit('admin', 'student', 'designer', 'customer'), createReview);

// PUT /api/reviews/:id
// עריכה: רק יוצר (נבדק בקונטרולר)
router.put(
  '/:id',
  authMiddleware,
  permit('admin', 'student', 'designer', 'customer'),
  updateReview
);

// DELETE /api/reviews/:id
// מחיקה: יוצר או אדמין (נבדק בקונטרולר)
router.delete(
  '/:id',
  authMiddleware,
  permit('admin', 'student', 'designer', 'customer'),
  deleteReview
);

module.exports = router;
