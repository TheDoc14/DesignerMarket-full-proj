// back-end/controllers/admin.controller.js
const User = require('../models/Users.models');
const Role = require('../models/Role.model');
const Project = require('../models/Project.model');
const Review = require('../models/Review.model');
const {
  pickUserPublic,
  pickProjectPublic,
  pickReviewPublic,
  pickProjectStats,
} = require('../utils/serializers.utils');
const { getBaseUrl } = require('../utils/url.utils');
const { getPaging, escapeRegex, toSort } = require('../utils/query.utils');
const { buildMeta } = require('../utils/meta.utils');
const { ROLES } = require('../constants/roles.constants');
/**
 * 👥 adminListUsers
 * מחזיר רשימת משתמשים לאדמין עם פילטרים (q/role/approved) ופגינציה.
 * משתמש ב־pickUserPublic(forRole='admin') כדי לא לחשוף שדות רגישים אבל כן לחשוף approvalDocument כשצריך.
 * מיועד למסך ניהול משתמשים + אישורי סטודנטים/מעצבים.
 */
const adminListUsers = async (req, res, next) => {
  try {
    const { q, role, approved } = req.query;

    const { page, limit, skip } = getPaging(req.query, 20);

    const filter = {};

    if (
      role &&
      [ROLES.ADMIN, ROLES.CUSTOMER, ROLES.STUDENT, ROLES.DESIGNER, ROLES.SYSTEM_MANAGER].includes(
        role
      )
    ) {
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

    if (user.role !== ROLES.STUDENT && user.role !== ROLES.DESIGNER) {
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

    const { page, limit, skip } = getPaging(req.query, 20);

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

    const { page, limit, skip } = getPaging(req.query, 20);

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
        User.countDocuments({ role: { $in: [ROLES.STUDENT, ROLES.DESIGNER] }, isApproved: false }),
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

// ==============================
// Roles (Dynamic RBAC) - Admin
// ==============================

/**
 * 🧩 adminListRoles
 * מחזיר רשימת Roles (כולל system roles) עם פגינציה ומטא אחיד.
 * מיועד למסך ניהול Roles בפאנל.
 */
const adminListRoles = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req.query, 50);

    const [total, roles] = await Promise.all([
      Role.countDocuments({}),
      Role.find({}).sort({ isSystem: -1, key: 1 }).skip(skip).limit(limit).lean(),
    ]);

    return res.status(200).json({
      message: 'Roles fetched',
      meta: buildMeta(total, page, limit),
      roles,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ➕ adminCreateRole
 * יוצר Role חדש (לא system).
 */
const adminCreateRole = async (req, res, next) => {
  try {
    const { key, label = '', permissions = [] } = req.body;

    const normalizedKey = String(key).trim().toLowerCase();

    const exists = await Role.findOne({ key: normalizedKey }).lean();
    if (exists) throw new Error('Role already exists');

    const role = await Role.create({
      key: normalizedKey,
      label,
      permissions,
      isSystem: false,
    });

    return res.status(201).json({
      message: 'Role created',
      role,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✏️ adminUpdateRole
 * מעדכן label/permissions ל-Role לפי key.
 * (לפי החלטה שלך – מאפשר גם system roles, אבל לא שינוי key)
 */
const adminUpdateRole = async (req, res, next) => {
  try {
    const normalizedKey = String(req.params.key).trim().toLowerCase();
    const { label, permissions } = req.body;

    const role = await Role.findOne({ key: normalizedKey });
    if (!role) throw new Error('Role not found');
    if (typeof label === 'string') role.label = label;
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();

    return res.status(200).json({
      message: 'Role updated',
      role,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 🗑️ adminDeleteRole
 * מוחק Role שאינו system ושאינו בשימוש.
 */
const adminDeleteRole = async (req, res, next) => {
  try {
    const normalizedKey = String(req.params.key).trim().toLowerCase();

    const role = await Role.findOne({ key: normalizedKey });
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('Cannot delete system role');

    const used = await User.exists({ role: role.key });
    if (used) throw new Error('Cannot delete role that is assigned to users');

    await role.deleteOne();

    return res.status(200).json({
      message: 'Role deleted',
    });
  } catch (err) {
    next(err);
  }
};

// ==============================
// Assign role to user - Admin
// ==============================

/**
 * 👤 adminAssignUserRole
 * משייך Role למשתמש לפי key דינמי.
 * מחזיר user מסוריאלייז כמו שאר הפאנל (pickUserPublic).
 */
const adminAssignUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role: roleKey } = req.body;

    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    const normalizedKey = String(roleKey).trim().toLowerCase();
    const role = await Role.findOne({ key: normalizedKey }).lean();
    if (!role) throw new Error('Role does not exist');

    user.role = role.key;

    // לא חובה, אבל מונע מצב ש-role חדש תקוע "לא מאושר"
    if (user.role !== ROLES.STUDENT && user.role !== ROLES.DESIGNER) {
      user.isApproved = true;
    }

    await user.save();

    const baseUrl = getBaseUrl(req);
    const safe = pickUserPublic(user, { forRole: 'admin', baseUrl });

    return res.status(200).json({
      message: 'User role updated',
      user: safe,
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
  adminListRoles,
  adminCreateRole,
  adminUpdateRole,
  adminDeleteRole,
  adminAssignUserRole,
};
