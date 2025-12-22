//back-end/routes/review.routes.js
const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const { createReview, listReviews, updateReview, deleteReview, getReviewById } = require('../controllers/review.controller');

/**
 * Reviews API
 * - צפייה בביקורות: פתוח (ציבורי)
 * - יצירה: כל משתמש מחובר (כל התפקידים)
 * - עריכה: רק יוצר
 * - מחיקה: יוצר או אדמין
 */

// ציבורי – רשימת ביקורות לפי פרויקט (עם פגינציה/מיון)
router.get('/', listReviews);

// ציבורי – קריאת ביקורת בודדת (לבחירה)
router.get('/:id', getReviewById);

// יצירה – כל המשתמשים המחוברים (admin, student, designer, customer)
router.post('/', authMiddleware, permit('admin','student','designer','customer'), createReview);

// עריכה – רק יוצר
router.put('/:id', authMiddleware, permit('admin','student','designer','customer'), updateReview);

// מחיקה – יוצר או אדמין (הבדיקה בקונטרולר)
router.delete('/:id', authMiddleware, permit('admin','student','designer','customer'), deleteReview);

module.exports = router;