// back-end/controllers/review.controller.js
const mongoose = require('mongoose');
const Review = require('../models/Review.model');
const Project = require('../models/Project.model');
const { recalcProjectRatings } = require('../utils/reviews.utils');
const { pickReviewPublic } = require('../utils/serializers.utils');
const { getPaging, toSort } = require('../utils/query.utils');
const { buildMeta } = require('../utils/meta.utils');
const { ROLES } = require('../constants/roles.constants');
/**
 * ➕ createReview
 * יוצר תגובה חדשה לפרויקט עבור המשתמש המחובר (תגובה ייחודית per user+project).
 * מבצע בדיקות קיום פרויקט, שומר review, מפעיל recalcProjectRatings ומחזיר תגובה מסוריאלייז.
 * מיועד לשימוש אחרי רכישה/אינטראקציה (לוגיקת הרשאות נשארת ב־middleware/קונטרולר).
 */
const createReview = async (req, res, next) => {
  try {
    const { projectId, rating, text } = req.body;

    // וידוא פרויקט קיים
    const proj = await Project.findById(projectId).select('_id');
    if (!proj) throw new Error('Project not found');

    const review = await Review.create({
      projectId,
      userId: req.user.id,
      rating,
      text,
    });

    await recalcProjectRatings(projectId);

    // populate ל־user להצגה יפה
    const populated = await Review.findById(review._id).populate('userId', 'username profileImage');

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickReviewPublic(populated, { viewer });

    return res.status(201).json({ message: 'Review created', review: data });
  } catch (err) {
    next(err);
  }
};

/**
 * 📃 listReviews
 * מחזיר רשימת תגובות לפרויקט ספציפי בצורה ציבורית, עם פגינציה ומיון.
 * תומך ב־viewer אופציונלי (אם יש token) כדי להחזיר canEdit/canDelete לפי המשתמש.
 * לא דורש JWT כדי לאפשר צפייה לכל המשתמשים.
 */
const listReviews = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    const { page, limit, skip } = getPaging(req.query, 20);

    const sort = toSort(req.query.sortBy, req.query.order, ['createdAt', 'rating'], 'createdAt');

    const filter = { projectId: new mongoose.Types.ObjectId(projectId) };

    const [items, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'username profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const reviews = items.map((r) => pickReviewPublic(r, { viewer }));

    return res.status(200).json({
      message: 'Reviews fetched',
      meta: buildMeta(total, page, limit),
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✏️ updateReview
 * מאפשר עריכת תגובה רק ליוצר התגובה.
 * לאחר עדכון מפעיל recalcProjectRatings כדי לשמור averageRating ו־reviewsCount תקינים.
 * מחזיר review מסוריאלייז כולל הרשאות פעולה (canEdit/canDelete).
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) throw new Error('Review not found');

    if (String(review.userId) !== String(req.user.id)) {
      throw new Error('Access denied');
    }

    const updates = {};
    if (typeof req.body.rating !== 'undefined') updates.rating = req.body.rating;
    if (typeof req.body.text === 'string') updates.text = req.body.text.trim();

    const updated = await Review.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('userId', 'username profileImage');

    await recalcProjectRatings(review.projectId);

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickReviewPublic(updated, { viewer });

    return res.status(200).json({ message: 'Review updated', review: data });
  } catch (err) {
    next(err);
  }
};

/**
 * 🗑️ deleteReview
 * מאפשר מחיקת תגובה ליוצר או לאדמין (בדיקה חד משמעית בקונטרולר).
 * לאחר מחיקה מפעיל recalcProjectRatings לפרויקט הרלוונטי כדי לעדכן סטטיסטיקות.
 * מחזיר הודעת הצלחה ללא מידע רגיש.
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) throw new Error('Review not found');

    const isOwner = String(review.userId) === String(req.user.id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) throw new Error('Access denied');

    await Review.findByIdAndDelete(id);
    await recalcProjectRatings(review.projectId);

    return res.status(200).json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔎 getReviewById
 * מחזיר תגובה בודדת (שימוש אופציונלי/דיבאג/פיצ’רים עתידיים).
 * תומך ב־viewer אופציונלי כדי להחזיר canEdit/canDelete בצורה עקבית.
 * לא דורש JWT, אבל אם קיים token אפשר להחזיר הרשאות פעולה מדויקות.
 */
const getReviewById = async (req, res, next) => {
  try {
    const r = await Review.findById(req.params.id).populate('userId', 'username profileImage');
    if (!r) throw new Error('Review not found');

    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const data = pickReviewPublic(r, { viewer });

    return res.status(200).json({ message: 'Review fetched', review: data });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, listReviews, updateReview, deleteReview, getReviewById };
