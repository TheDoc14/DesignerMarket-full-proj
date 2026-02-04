//back-end/routes/review.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createReview,
  listReviews,
  updateReview,
  deleteReview,
  getReviewById,
} = require('../controllers/review.controller');
const { validate } = require('../middleware/validate.middleware');
const {
  reviewIdParam,
  listReviewsQuery,
  createReviewValidators,
  updateReviewValidators,
} = require('../validators/reviews.validators');
const { tryAuth } = require('../middleware/tryAuth.middleware'); // חשוב ל-viewer אופציונלי
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
router.get('/', tryAuth, listReviewsQuery, validate, listReviews);

// GET /api/reviews/:id
// ציבורי: ביקורת בודדת (לשימוש עתידי/דיבאג)
router.get('/:id', tryAuth, reviewIdParam, validate, getReviewById);

// POST /api/reviews
// יצירה: כל המשתמשים המחוברים
router.post('/', authMiddleware, createReviewValidators, validate, createReview);

// PUT /api/reviews/:id
// עריכה: רק יוצר (נבדק בקונטרולר)
router.put('/:id', authMiddleware, updateReviewValidators, validate, updateReview);

// DELETE /api/reviews/:id
// מחיקה: יוצר או אדמין (נבדק בקונטרולר)
router.delete('/:id', authMiddleware, reviewIdParam, validate, deleteReview);

module.exports = router;
