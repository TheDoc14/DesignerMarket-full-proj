// back-end/controllers/project.controller.js
const mongoose = require('mongoose');

const Project = require('../models/Project.model');
const User = require('../models/Users.models');
const Review = require('../models/Review.model');
const Order = require('../models/Order.model');

const {
  deleteUploadByFileUrl,
  deleteUploadsFromFilesArray,
} = require('../utils/filesCleanup.utils');
const { buildFileUrl } = require('../utils/url.utils');
const { pickProjectPublic } = require('../utils/serializers.utils');
const { escapeRegex, toSort, getPaging } = require('../utils/query.utils');
const { buildMeta } = require('../utils/meta.utils');
const { normalizeTags } = require('../utils/tags.utils');
const { ROLES } = require('../constants/roles.constants');
const { FILE_FOLDERS } = require('../constants/files.constants');

/**
 * getFileType
 * קובע סוג קובץ לפי mimetype/סיומת כדי לשמור אותו בתיקייה הנכונה.
 * מאפשר הפרדה בין media (ציבורי) לבין files (רגיש).
 */
const getFileType = (mimetype, filename) => {
  const ext = String(filename || '')
    .split('.')
    .pop()
    .toLowerCase();
  const mt = String(mimetype || '');

  if (mt.startsWith('image/')) return 'image';
  if (mt.startsWith('video/')) return 'video';

  if (mt === 'application/pdf' || mt.includes('powerpoint') || ext === 'ppt' || ext === 'pptx') {
    return 'presentation';
  }

  if (
    mt.startsWith('text/') ||
    mt.includes('word') ||
    mt.includes('officedocument') ||
    ext === 'doc' ||
    ext === 'docx' ||
    ext === 'txt'
  ) {
    return 'document';
  }

  return 'other';
};

/**
 * ➕ createProject
 * יוצר פרויקט חדש למשתמש מורשה עם העלאת קבצים.
 * מייצר URLs ציבוריים לקבצים, מגדיר mainImageId, ושומר tags בצורה אחידה במסד.
 */
const createProject = async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id).select('paypalEmail role');
    if ((me.role === ROLES.STUDENT || me.role === ROLES.DESIGNER) && !me.paypalEmail) {
      throw new Error('PayPal email is required before creating a project');
    }

    // 1) קריאת נתונים מה-body
    const { title, description, price, category, tags } = req.body;
    const mainImageIndex = Number(req.body.mainImageIndex);

    // 2) ולידציות בסיסיות (קבצים + mainImageIndex)
    if (!req.files || req.files.length === 0) throw new Error('No files uploaded');
    if (Number.isNaN(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= req.files.length) {
      throw new Error('Invalid mainImageIndex');
    }

    // 3) מחיר חייב להיות מספר
    const priceNum = Number(price);

    // 4) הפיכת קבצים לאובייקטים שנשמרים במסד (כולל URL ציבורי)
    const files = req.files.map((file) => {
      const id = new mongoose.Types.ObjectId();
      const fileType = getFileType(file.mimetype, file.originalname);

      // images/videos -> projectImages, כל השאר -> projectFiles
      const subfolder =
        fileType === 'image' || fileType === 'video'
          ? FILE_FOLDERS.PROJECT_IMAGES
          : FILE_FOLDERS.PROJECT_FILES;

      return {
        _id: id,
        filename: file.filename,
        fileType,
        path: buildFileUrl(req, [FILE_FOLDERS.PROJECTS, subfolder], file.filename),
      };
    });

    // 5) בדיקה שה-main image באמת תמונה
    const mainFile = files[mainImageIndex];
    if (mainFile.fileType !== 'image') throw new Error('Main file must be an image');

    // 6) יצירת פרויקט במסד (כולל tags נקיים)
    const project = await Project.create({
      title,
      description,
      price: priceNum,
      category,
      tags: normalizeTags(tags),
      createdBy: req.user.id,
      files,
      mainImageId: mainFile._id,
      /*or*/
      isPublished: false, // פרויקט חדש תמיד לא מפורסם
    });

    // 7) החזרת פרויקט מסוריאלייז (אחיד ובטוח)
    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickProjectPublic(project, { req, viewer });

    return res.status(201).json({ message: 'Project created successfully', project: data });
  } catch (err) {
    try {
      deleteUploadsFromFilesArray(req.files);
    } catch (_err) {}
    next(err);
  }
};

/**
 * 📃 getAllProjects
 * מחזיר רשימת פרויקטים לפי הרשאות חשיפה: ציבור רואה published; משתמש רואה גם את שלו; אדמין רואה הכל.
 * תומך בפגינציה+מיון+פילטרים, ומחזיר meta אחיד כדי שהפרונט ידע לבנות רשימות בצורה קבועה.
 */
const getAllProjects = async (req, res, next) => {
  try {
    // 1) זיהוי הצופה (viewer) לפי token אופציונלי
    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const isAdmin = viewer?.role === ROLES.ADMIN;

    // 2) פילטר הרשאות (accessFilter)
    let accessFilter = { isPublished: true };
    if (viewer && !isAdmin) {
      accessFilter = { $or: [{ isPublished: true }, { createdBy: viewer.id }] };
    }
    if (isAdmin) {
      accessFilter = {};
    }

    // 3) פילטרים מה-query (business filters)
    const { q, category, minPrice, maxPrice, tags } = req.query;
    const extraFilter = {};

    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      extraFilter.$or = [{ title: rx }, { description: rx }];
    }

    if (typeof category === 'string' && category.trim()) {
      extraFilter.category = category.trim();
    }

    const priceFilter = {};
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (Number.isFinite(min)) priceFilter.$gte = min;
    if (Number.isFinite(max)) priceFilter.$lte = max;
    if (Object.keys(priceFilter).length) extraFilter.price = priceFilter;

    const tagsArr = normalizeTags(tags);
    if (tagsArr.length) {
      // OR: מספיק שתהיה תגית אחת
      extraFilter.tags = { $in: tagsArr };
      // AND אם תרצה: { $all: tagsArr }
    }

    // 4) שילוב פילטרים (AND) בלי לשבור הרשאות
    const filter =
      Object.keys(extraFilter).length > 0 ? { $and: [accessFilter, extraFilter] } : accessFilter;

    // 5) פגינציה + מיון
    const { page, limit, skip } = getPaging(req.query, 20);

    const sort = toSort(
      req.query.sortBy,
      req.query.order,
      ['createdAt', 'price', 'averageRating', 'reviewsCount'],
      'createdAt'
    );

    // 6) שליפה מהמסד + count במקביל
    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter).populate('createdBy', '_id role').sort(sort).skip(skip).limit(limit),
    ]);

    // 7) סיריאלייז בטוח לפרונט
    const data = projects.map((p) => pickProjectPublic(p, { req, viewer }));

    return res.status(200).json({
      message: 'Projects fetched successfully',
      meta: buildMeta(total, page, limit),
      projects: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔎 getProjectById
 * מחזיר פרויקט יחיד בצורה בטוחה; serializer קובע מה לחשוף לפי viewer
 * (media תמיד, files רק owner/admin/paid buyer).
 * אם הפרויקט לא published — רק הבעלים או אדמין יכולים לצפות בו.
 */
const getProjectById = async (req, res, next) => {
  try {
    // 1) שליפת פרויקט + createdBy כדי לבדוק בעלות/role
    const p = await Project.findById(req.params.id).populate('createdBy', '_id role');
    if (!p) throw new Error('Project not found');

    // 2) זיהוי viewer (tryAuth) כדי לאפשר owner/admin
    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;

    const isAdmin = viewer?.role === ROLES.ADMIN;
    const isOwner = viewer?.id && String(viewer.id) === String(p.createdBy?._id || p.createdBy);

    // 3) אם לא מפורסם - רק owner/admin
    if (p.isPublished === false) {
      if (!isAdmin && !isOwner) throw new Error('Access denied');
    }

    // 4) האם הצופה רכש את הפרויקט? (רק אם יש viewer והוא לא owner/admin)
    let hasPurchased = false;
    if (viewer && !isAdmin && !isOwner) {
      const exists = await Order.exists({
        projectId: p._id,
        buyerId: viewer.id,
        status: { $in: ['PAID', 'PAYOUT_SENT'] },
      });
      hasPurchased = Boolean(exists);
    }

    // 5) מעבירים ל-serializer "הרשאה לקבצים" (משתמשים במבנה viewer קיים)
    const viewerForSerializer = viewer
      ? { ...viewer, canAccessFiles: isAdmin || isOwner || hasPurchased }
      : undefined;

    // 6) החזרה מסוריאלייז (קבצים רגישים רק למורשים)
    const data = pickProjectPublic(p, { req, viewer: viewerForSerializer });

    return res.status(200).json({ message: 'Project fetched successfully', project: data });
  } catch (err) {
    next(err);
  }
};

/**
 * ✏️ updateProject
 * מעדכן פרויקט קיים: רק הבעלים או אדמין.
 * מאפשר עדכון שדות, tags, והוספת קבצים חדשים תוך שמירה על URLs ציבוריים עקביים.
 */
const updateProject = async (req, res, next) => {
  try {
    // 1) שליפת הפרויקט ובדיקת קיום
    const p = await Project.findById(req.params.id).populate('createdBy', '_id role');
    if (!p) throw new Error('Project not found');

    // 2) בדיקת הרשאה: owner/admin בלבד
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = String(p.createdBy._id) === String(req.user.id);
    if (!isAdmin && !isOwner) throw new Error('Access denied');

    // 3) עדכון שדות טקסט/מספרים
    const { title, description, price, category, mainImageId, tags } = req.body;

    if (typeof title === 'string') p.title = title;
    if (typeof description === 'string') p.description = description;

    if (price !== undefined) {
      p.price = Number(price); // validator מבטיח שזה מספר
    }

    if (typeof category === 'string') p.category = category;

    // 4) עדכון mainImageId (אם נשלח)
    if (mainImageId) p.mainImageId = mainImageId;

    // 5) עדכון tags (אם נשלח כולל אפשרות לניקוי)
    if (typeof tags !== 'undefined') {
      p.tags = normalizeTags(tags);
    }

    // 6) הוספת קבצים חדשים (אם הגיעו)
    if (req.files && req.files.length) {
      req.files.forEach((file) => {
        const fileType = getFileType(file.mimetype, file.originalname);
        const subfolder =
          fileType === 'image' || fileType === 'video'
            ? FILE_FOLDERS.PROJECT_IMAGES
            : FILE_FOLDERS.PROJECT_FILES;

        p.files.push({
          _id: new mongoose.Types.ObjectId(),
          filename: file.filename,
          fileType,
          path: buildFileUrl(req, [FILE_FOLDERS.PROJECTS, subfolder], file.filename),
        });
      });
    }

    // 7) שמירה והחזרה מסוריאלייז
    await p.save();

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickProjectPublic(p, { req, viewer });

    return res.status(200).json({ message: 'Project updated successfully', project: data });
  } catch (err) {
    try {
      deleteUploadsFromFilesArray(req.files);
    } catch (_err) {}
    next(err);
  }
};

/**
 * 🗑️ deleteProject
 * מוחק פרויקט: רק בעלים או אדמין.
 * מנקה קבצים פיזיים מהשרת (best-effort) ומוחק reviews כדי לא להשאיר נתונים יתומים במסד.
 */
const deleteProject = async (req, res, next) => {
  try {
    // 1) שליפת הפרויקט עם createdBy/files כדי למחוק קבצים ולהרשות מחיקה
    const project = await Project.findById(req.params.id).select('createdBy files');
    if (!project) throw new Error('Project not found');

    // 2) בדיקת הרשאה: owner/admin
    const isOwner = String(project.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) throw new Error('Access denied');

    // 3) ניקוי קבצים פיזיים מה-uploads (best-effort)
    const files = Array.isArray(project.files) ? project.files : [];
    for (const f of files) {
      if (f && f.path) {
        try {
          deleteUploadByFileUrl(String(f.path));
        } catch (_err) {
          // best-effort cleanup
        }
      }
    }

    // 4) מחיקת reviews ואז מחיקת הפרויקט
    await Review.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * 🗑️ deleteProjectFile
 * מוחק קובץ ספציפי מתוך פרויקט (רק owner או admin).
 * חשוב:
 * - אם מוחקים את תמונת ה-main (mainImageId) חייבים לבחור תמונת main חלופית.
 * - מבצע best-effort למחיקת הקובץ הפיזי מה-uploads.
 */
const deleteProjectFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    // 1) שליפת הפרויקט ובדיקת קיום
    const p = await Project.findById(id).populate('createdBy', '_id role');
    if (!p) throw new Error('Project not found');

    // 2) בדיקת הרשאה: owner/admin בלבד
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = String(p.createdBy._id) === String(req.user.id);
    if (!isAdmin && !isOwner) throw new Error('Access denied');

    // 3) מציאת הקובץ המבוקש בתוך files[]
    const filesArr = Array.isArray(p.files) ? p.files : [];
    const target = filesArr.find((f) => String(f._id) === String(fileId));
    if (!target) throw new Error('File not found in project');

    // 4) אם מוחקים את תמונת ה-main -> לבחור main חלופי
    const isMainImage = String(p.mainImageId) === String(fileId);

    if (isMainImage) {
      const nextMain = filesArr.find(
        (f) => f.fileType === 'image' && String(f._id) !== String(fileId)
      );

      // אין תמונה חלופית -> לא מאפשרים מחיקה כי mainImageId required בסכמה
      if (!nextMain) throw new Error('Cannot delete main image (no alternative image exists)');

      p.mainImageId = nextMain._id;
    }

    // 5) מחיקה פיזית (best-effort) לפי URL שנשמר אצלכם ב-path
    if (target.path) {
      try {
        deleteUploadByFileUrl(String(target.path));
      } catch (_err) {
        // best-effort cleanup
      }
    }

    // 6) הסרת הקובץ מהמערך ושמירה
    p.files = filesArr.filter((f) => String(f._id) !== String(fileId));

    await p.save();

    // 7) החזרה מסוריאלייז
    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickProjectPublic(p, { req, viewer });

    return res.status(200).json({
      message: 'Project file deleted successfully',
      project: data,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  deleteProjectFile,
};
