// back-end/controllers/admin.controller.js
const User = require('../models/Users.models');
const Project = require('../models/Project.model');
const Review = require('../models/Review.model');
const {
  pickUserPublic,
  pickProjectPublic,
  pickReviewPublic,
  pickProjectStats,
} = require('../utils/serializers.utils');
const { getBaseUrl } = require('../utils/url.utils');
const { toInt, escapeRegex, toSort } = require('../utils/query.utils');
const { buildMeta } = require('../utils/meta.utils');

/**
 * 👥 adminListUsers
 * מחזיר רשימת משתמשים לאדמין עם פילטרים (q/role/approved) ופגינציה.
 * משתמש ב־pickUserPublic(forRole='admin') כדי לא לחשוף שדות רגישים אבל כן לחשוף approvalDocument כשצריך.
 * מיועד למסך ניהול משתמשים + אישורי סטודנטים/מעצבים.
 */
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
      meta: buildMeta(total, page, limit),
      users: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ adminSetUserApproval
 * מעדכן isApproved למשתמש (רק student/designer) על בסיס החלטת אדמין.
 * מבצע ולידציה לקלט (true/false), מאמת משתמש קיים ותפקיד מתאים.
 * מחזיר user מסוריאלייז לאדמין לאחר עדכון.
 */
const adminSetUserApproval = async (req, res, next) => {
  try {
    let val = req.body.isApproved;
    if (typeof val === 'string') val = val === 'true';

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
  } catch (err) {
    next(err);
  }
};

/**
 * 📦 adminListProjects
 * מחזיר רשימת פרויקטים לאדמין עם פילטרים (published/category/q) ופגינציה.
 * אדמין מקבל viewer=admin ולכן serializer יכול להחזיר גם קבצים רגישים אם צריך.
 * מיועד למסך ניהול פרויקטים + pending publish.
 */
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
      meta: buildMeta(total, page, limit),
      projects: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 🚀 adminSetProjectPublish
 * מעדכן isPublished לפרויקט על בסיס החלטת אדמין.
 * מבצע ולידציה לקלט, מאמת שהפרויקט קיים, ומחזיר פרויקט מסוריאלייז לאחר העדכון.
 * מיועד לכפתור “Approve/Unpublish” בפאנל אדמין.
 */
const adminSetProjectPublish = async (req, res, next) => {
  try {
    let isPublished = req.body.isPublished;
    if (typeof isPublished === 'string') isPublished = isPublished === 'true';

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true }
    ).populate('createdBy', '_id role');

    if (!project) throw new Error('Project not found');

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickProjectPublic(project, { req, viewer });

    return res.status(200).json({ message: 'Project publish updated', project: data });
  } catch (err) {
    next(err);
  }
};

/**
 * 🧾 adminListReviews
 * מחזיר רשימת תגובות מערכתית לאדמין (כולל פילטר projectId) עם פגינציה ומיון.
 * משתמש ב־serializer של review כדי לשמור על canDelete/canEdit עקביים ולהוסיף מידע פרויקט בסיסי.
 * מיועד לניהול תגובות לא ראויות מתוך הפאנל.
 */
const adminListReviews = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (projectId) filter.projectId = projectId;

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
        project: r.projectId
          ? { id: String(r.projectId._id), title: r.projectId.title }
          : undefined,
      };
    });

    return res.status(200).json({
      message: 'Reviews fetched',
      meta: buildMeta(total, page, limit),
      reviews: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 📊 adminGetStats
 * מחזיר סטטיסטיקות MVP של המערכת (סה״כ משתמשים/פרויקטים/תגובות + Top Rated/Most Reviewed).
 * מבוסס שאילתות DB מהירות יחסית (count + find+sort+limit), כדי לתמוך במסך Dashboard.
 * מחזיר מבנה עקבי כדי שהפרונט יוכל להציג בקלות כרטיסים/טבלאות.
 */
const adminGetStats = async (req, res, next) => {
  try {
    const [usersTotal, usersPendingApproval, projectsTotal, projectsPendingPublish, reviewsTotal] =
      await Promise.all([
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
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminListUsers,
  adminSetUserApproval,
  adminListProjects,
  adminSetProjectPublish,
  adminListReviews,
  adminGetStats,
};
