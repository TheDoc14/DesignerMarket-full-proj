//back-end/controllers/review.controller.js
const mongoose = require('mongoose');
const Review = require('../models/Review.model');
const Project = require('../models/Project.model');
const { recalcProjectRatings } = require('../utils/reviews.utils');
const { pickReviewPublic } = require('../utils/serializers.utils');

// עוזר לפגינציה/מיון
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const toSort = (sortBy, order) => {
  const field = ['createdAt', 'rating'].includes(sortBy) ? sortBy : 'createdAt';
  const dir = (order === 'asc' || order === 'ASC') ? 1 : -1;
  return { [field]: dir };
};

// POST /api/reviews
// כל משתמש מחובר יכול להגיב (unique per user+project לפי האינדקס)
const createReview = async (req, res, next) => {
  try {
    const { projectId, rating, text } = req.body;
    if (!projectId) throw new Error('Project ID is required');
    if (!rating) throw new Error('Rating is required');

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
    const populated = await Review.findById(review._id)
      .populate('userId', 'username profileImage');

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickReviewPublic(populated, { viewer });

    return res.status(201).json({ message: 'Review created', review: data });
  } catch (err) { next(err); }
};

// GET /api/reviews?projectId=...&page=&limit=&sortBy=&order=
// ציבורי לצפייה; אין צורך בטוקן
const listReviews = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) throw new Error('Project ID is required');

    const page  = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const sort  = toSort(req.query.sortBy, req.query.order);

    const filter = { projectId: new mongoose.Types.ObjectId(projectId) };

    const [items, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'username profileImage')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const reviews = items.map(r => pickReviewPublic(r, { viewer }));

    return res.status(200).json({
      message: 'Reviews fetched',
      total,
      page,
      limit,
      reviews,
    });
  } catch (err) { next(err); }
};

// PUT /api/reviews/:id
// רק יוצר התגובה יכול לערוך
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
    if (typeof req.body.text   === 'string')     updates.text   = req.body.text.trim();

    const updated = await Review.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('userId', 'username profileImage');

    await recalcProjectRatings(review.projectId);

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickReviewPublic(updated, { viewer });

    return res.status(200).json({ message: 'Review updated', review: data });
  } catch (err) { next(err); }
};

// DELETE /api/reviews/:id
// יוצר התגובה או אדמין יכולים למחוק
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) throw new Error('Review not found');

    const isOwner = String(review.userId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) throw new Error('Access denied');

    await Review.findByIdAndDelete(id);
    await recalcProjectRatings(review.projectId);

    return res.status(200).json({ message: 'Review deleted' });
  } catch (err) { next(err); }
};

// (בחירה) GET /api/reviews/:id — לצורך דיבאג/שימוש עתידי
const getReviewById = async (req, res, next) => {
  try {
    const r = await Review.findById(req.params.id)
      .populate('userId', 'username profileImage');
    if (!r) throw new Error('Review not found');

    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const data = pickReviewPublic(r, { viewer });

    return res.status(200).json({ message: 'Review fetched', review: data });
  } catch (err) { next(err); }
};

module.exports = { createReview, listReviews, updateReview, deleteReview, getReviewById };