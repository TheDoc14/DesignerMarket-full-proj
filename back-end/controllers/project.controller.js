// back-end/controllers/project.controller.js
const mongoose = require('mongoose');
const Project = require('../models/Project.model');
const Review = require('../models/Review.model');
const { deleteUploadByFileUrl } = require('../utils/filesCleanup.utils');
const { buildFileUrl } = require('../utils/url.utils');
const { pickProjectPublic } = require('../utils/serializers.utils');

const getFileType = (mimetype, filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (
    mimetype === 'application/pdf' ||
    mimetype.includes('powerpoint') ||
    ext === 'ppt' ||
    ext === 'pptx'
  )
    return 'presentation';
  if (
    mimetype.startsWith('text/') ||
    mimetype.includes('word') ||
    mimetype.includes('officedocument') ||
    ext === 'doc' ||
    ext === 'docx' ||
    ext === 'txt'
  )
    return 'document';
  return 'other';
};

/**
 * ➕ createProject
 * יוצר פרויקט חדש למשתמש מורשה (student/designer/admin) ותומך בהעלאת קבצים (images/files).
 * שומר קישורים ציבוריים לקבצים דרך url utils/serializers ומגדיר mainImageId לפי הצורך.
 * מחזיר פרויקט מסוריאלייז כדי לא לחשוף נתיבים פנימיים או קבצים רגישים לציבור.
 */
const createProject = async (req, res, next) => {
  try {
    const { title, description, price, category } = req.body;
    const mainImageIndex = Number(req.body.mainImageIndex);

    if (!req.files || req.files.length === 0) throw new Error('No files uploaded');
    if (isNaN(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= req.files.length)
      throw new Error('Invalid mainImageIndex');

    const priceNum = Number(price);
    if (isNaN(priceNum)) throw new Error('Price must be a valid number');

    const files = req.files.map((file) => {
      const id = new mongoose.Types.ObjectId();
      const fileType = getFileType(file.mimetype, file.originalname);
      const subfolder =
        fileType === 'image' || fileType === 'video' ? 'projectImages' : 'projectFiles';
      return {
        _id: id,
        filename: file.filename,
        fileType,
        // URL ציבורי דרך שכבת /api/files (לא שביל דיסק)
        path: buildFileUrl(req, ['projects', subfolder], file.filename),
      };
    });

    const mainFile = files[mainImageIndex];
    if (mainFile.fileType !== 'image') throw new Error('Main file must be an image');

    const project = await Project.create({
      title,
      description,
      price: priceNum,
      category,
      createdBy: req.user.id,
      files,
      mainImageId: mainFile._id,
    });

    return res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) {
    next(err);
  }
};

/**
 * 📃 getAllProjects
 * מחזיר רשימת פרויקטים עם חשיפה חכמה לפי isPublished והצופה (viewer):
 * ציבורי רואה published בלבד; משתמש מחובר רואה גם את שלו; אדמין רואה הכל.
 * מחזיר נתונים מסוריאלייז (pickProjectPublic) שמטפל בהפרדת media (ציבורי) מול files (רגיש).
 */
const getAllProjects = async (req, res, next) => {
  try {
    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const isAdmin = viewer?.role === 'admin';

    let filter = { isPublished: true };

    // אם יש טוקן:
    // אדמין רואה הכל, משתמש רגיל רואה published + שלו
    if (viewer && !isAdmin) {
      filter = { $or: [{ isPublished: true }, { createdBy: viewer.id }] };
    }
    if (isAdmin) {
      filter = {};
    }

    const projects = await Project.find(filter)
      .populate('createdBy', '_id role')
      .sort({ createdAt: -1 });

    const data = projects.map((p) => pickProjectPublic(p, { req, viewer }));
    return res.status(200).json({
      message: 'Projects fetched successfully',
      total: data.length,
      projects: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 🔎 getProjectById
 * מחזיר פרויקט יחיד בצורה ציבורית, עם חשיפת קבצים רגישים רק לבעלים/אדמין.
 * מזהה viewer לפי token אופציונלי (tryAuth) ומעביר אותו ל־serializer כדי לקבוע הרשאות חשיפה.
 * מחזיר פרויקט מסוריאלייז עקבי עם הרשאות צפייה נכונות.
 */
const getProjectById = async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id).populate('createdBy', '_id role');
    if (!p) throw new Error('Project not found');
    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;

    // אם הפרויקט לא מפורסם – רק אדמין או בעלים יכולים לראות
    if (p.isPublished === false) {
      const isAdmin = viewer?.role === 'admin';
      const isOwner = viewer?.id && String(viewer.id) === String(p.createdBy?._id || p.createdBy);
      if (!isAdmin && !isOwner) throw new Error('Access denied');
    }
    const data = pickProjectPublic(p, { req, viewer }); // <<--- מעבירים req

    return res.status(200).json({ message: 'Project fetched successfully', project: data });
  } catch (err) {
    next(err);
  }
};

/**
 * ✏️ updateProject
 * מעדכן פרויקט קיים: רק בעלים או אדמין (לוגיקת הרשאה מלאה בקונטרולר).
 * תומך בהוספת קבצים חדשים, עדכון שדות, ושמירה עקבית של URLs לקבצים.
 * מחזיר פרויקט מסוריאלייז כדי לשמור על מבנה תגובה אחיד ובטוח.
 */
const updateProject = async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id).populate('createdBy', '_id role');
    if (!p) throw new Error('Project not found');

    const isAdmin = req.user.role === 'admin';
    const isOwner = String(p.createdBy._id) === String(req.user.id);
    if (!isAdmin && !isOwner) throw new Error('Access denied');

    const { title, description, price, category, mainImageId } = req.body;

    if (typeof title === 'string') p.title = title;
    if (typeof description === 'string') p.description = description;
    if (price !== undefined) {
      const n = Number(price);
      if (isNaN(n)) throw new Error('Price must be a valid number');
      p.price = n;
    }
    if (typeof category === 'string') p.category = category;
    if (mainImageId) p.mainImageId = mainImageId;

    // אם הגיעו קבצים חדשים — נוסיף
    if (req.files && req.files.length) {
      req.files.forEach((file) => {
        const fileType = getFileType(file.mimetype, file.originalname);
        const subfolder =
          fileType === 'image' || fileType === 'video' ? 'projectImages' : 'projectFiles';
        p.files.push({
          _id: new mongoose.Types.ObjectId(),
          filename: file.filename,
          fileType,
          path: buildFileUrl(req, ['projects', subfolder], file.filename),
        });
      });
    }

    await p.save();

    const viewer = { id: req.user.id, role: req.user.role };
    const data = pickProjectPublic(p, { req, viewer });
    return res.status(200).json({ message: 'Project updated successfully', project: data });
  } catch (err) {
    next(err);
  }
};

/**
 * 🗑️ deleteProject
 * מוחק פרויקט: רק בעלים או אדמין, כולל ניקוי קבצים פיזיים מתוך uploads.
 * מוחק גם reviews שקשורים לפרויקט (או מעדכן סטטיסטיקות לפי הלוגיקה אצלך) כדי לא להשאיר “זבל”.
 * ניהול מחיקות קבצים נעשה best-effort כדי לא להפיל בקשה בגלל קובץ חסר/נעול.
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('createdBy files');
    if (!project) throw new Error('Project not found');

    const isOwner = String(project.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) throw new Error('Access denied');

    // 1) מחיקת קבצים פיזיים (best-effort)
    const files = Array.isArray(project.files) ? project.files : [];
    for (const f of files) {
      if (f && f.path) {
        try {
          deleteUploadByFileUrl(String(f.path));
        } catch (_err) {
          // לא מפילים מחיקת פרויקט בגלל cleanup
        }
      }
    }

    // 2) מחיקת reviews של הפרויקט
    await Review.deleteMany({ projectId: project._id });

    // 3) מחיקת הפרויקט
    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject };
