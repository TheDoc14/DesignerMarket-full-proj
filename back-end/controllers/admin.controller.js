// back-end/controllers/admin.controller.js
const mongoose = require('mongoose');
const User = require('../models/Users.models');
const Project = require('../models/Project.model');
const Review = require('../models/Review.model');
const { pickUserPublic, pickProjectPublic, pickReviewPublic, pickProjectStats } = require('../utils/serializers.utils');
const { getBaseUrl } = require('../utils/url.utils');
const { toInt, escapeRegex, toSort } = require('../utils/query.utils');

// =====================
// USERS (Admin)
// =====================
// GET /api/admin/users?q=&role=&approved=&page=&limit=
const adminListUsers = async (req, res, next) => {
  try {
    const { q, role, approved } = req.query;

    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (role && ['admin', 'customer', 'student', 'designer'].includes(role)) {
      filter.role = role;
    }

    if (approved === 'true') filter.isApproved = true;
    if (approved === 'false') filter.isApproved = false;

    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ username: rx }, { email: rx }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const baseUrl = getBaseUrl(req);
    const data = users.map((u) => pickUserPublic(u, { forRole: 'admin', baseUrl }));

    return res.status(200).json({
      message: 'Users fetched',
      total,
      page,
      limit,
      users: data,
    });
  } catch (err) { next(err); }
};

// PUT /api/admin/users/:id/approval
// body: { "isApproved": true/false }
const adminSetUserApproval = async (req, res, next) => {
  try {
    const { isApproved } = req.body;

    let val = isApproved;
    if (typeof val === 'string') {
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
    }

    if (typeof val !== 'boolean') throw new Error('Invalid request');

    const user = await User.findById(req.params.id);
    if (!user) throw new Error('User not found');

    if (user.role !== 'student' && user.role !== 'designer') {
      throw new Error('Invalid request');
    }

    user.isApproved = val;
    await user.save();

    const baseUrl = getBaseUrl(req);
    const safe = pickUserPublic(user, { forRole: 'admin', baseUrl });

    return res.status(200).json({ message: 'User approval updated', user: safe });
  } catch (err) { next(err); }
};

// =====================
// PROJECTS (Admin)
// =====================
// GET /api/admin/projects?published=&q=&category=&page=&limit=
const adminListProjects = async (req, res, next) => {
  try {
    const { q, category, published } = req.query;

    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (published === 'true') filter.isPublished = true;
    if (published === 'false') filter.isPublished = false;

    if (category) filter.category = category;

    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: rx }, { description: rx }];
    }

    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .populate('createdBy', '_id role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const viewer = { id: req.user.id, role: req.user.role }; // admin
    const data = projects.map((p) => pickProjectPublic(p, { req, viewer }));

    return res.status(200).json({
      message: 'Projects fetched',
      total,
      page,
      limit,
      projects: data,
    });
  } catch (err) { next(err); }
};

// PUT /api/admin/projects/:id/publish
// body: { "isPublished": true/false }
const adminSetProjectPublish = async (req, res, next) => {
  try {
    let { isPublished } = req.body;

    if (typeof isPublished === 'string') {
      if (isPublished === 'true') isPublished = true;
      else if (isPublished === 'false') isPublished = false;
    }

    if (typeof isPublished !== 'boolean') throw new Error('Invalid request');

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true }
    ).populate('createdBy', '_id role');

    if (!project) throw new Error('Project not found');

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickProjectPublic(project, { req, viewer });

    return res.status(200).json({ message: 'Project publish updated', project: data });
  } catch (err) { next(err); }
};

// =====================
// REVIEWS (Admin list)
// =====================
// GET /api/admin/reviews?projectId=&page=&limit=&sortBy=&order=
const adminListReviews = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error('Invalid request');
      filter.projectId = projectId;
    }

    const sort = toSort(req.query.sortBy, req.query.order, ['createdAt', 'rating'], 'createdAt');

    const [total, rows] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .populate('userId', 'username profileImage')
        .populate('projectId', 'title')
        .sort(sort)
        .skip(skip)
        .limit(limit),
    ]);

    const viewer = { id: req.user.id, role: req.user.role }; // admin
    const data = rows.map((r) => {
      const base = pickReviewPublic(r, { viewer });
      return {
        ...base,
        project: r.projectId ? { id: String(r.projectId._id), title: r.projectId.title } : undefined,
      };
    });

    return res.status(200).json({
      message: 'Reviews fetched',
      total,
      page,
      limit,
      reviews: data,
    });
  } catch (err) { next(err); }
};

// =====================
// STATS (MVP)
// =====================
// GET /api/admin/stats
const adminGetStats = async (req, res, next) => {
  try {
    const [
      usersTotal,
      usersPendingApproval,
      projectsTotal,
      projectsPendingPublish,
      reviewsTotal,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['student', 'designer'] }, isApproved: false }),
      Project.countDocuments({}),
      Project.countDocuments({ isPublished: false }),
      Review.countDocuments({}),
    ]);

    const topRated = await Project.find({})
       .sort({ averageRating: -1, reviewsCount: -1 })
       .limit(5)
       .select('title averageRating reviewsCount isPublished');

    const mostReviewed = await Project.find({})
       .sort({ reviewsCount: -1, averageRating: -1 })
       .limit(5)
       .select('title averageRating reviewsCount isPublished');

    return res.status(200).json({
        message: 'Stats fetched',
        stats: {
            usersTotal,
            usersPendingApproval,
            projectsTotal,
            projectsPendingPublish,
            reviewsTotal,
            topRated: topRated.map(pickProjectStats),
            mostReviewed: mostReviewed.map(pickProjectStats),
        },
    });

  } catch (err) { next(err); }
};

module.exports = { adminListUsers, adminSetUserApproval, adminListProjects,
 adminSetProjectPublish, adminListReviews, adminGetStats };