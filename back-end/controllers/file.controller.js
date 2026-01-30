// back-end/controllers/file.controller.js
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project.model');
const { ROLES } = require('../constants/roles.constants');
const { FILE_FOLDERS } = require('../constants/files.constants');
/**
 * 📥 getFile
 * מגיש קבצים מתוך uploads דרך /api/files/... בצורה מבוקרת.
 * מבצע בדיקות הרשאה לפי סוג תיקייה: projectFiles דורש בעלות/אדמין, approvalDocuments אדמין בלבד.
 * מחזיר sendFile אם הקובץ קיים, אחרת זורק שגיאה מסודרת ל־error middleware.
 */
const getFile = async (req, res, next) => {
  try {
    const parts = req.path.split('/').filter(Boolean);
    const folder = parts[0];
    const subfolder = parts.length === 3 ? parts[1] : null;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const rawFilename = decodeURIComponent(parts[parts.length - 1]);
    const ALLOWED = new Set([
      FILE_FOLDERS.PROFILE_IMAGES,
      FILE_FOLDERS.APPROVAL_DOCUMENTS,
      FILE_FOLDERS.PROJECTS,
    ]);
    const ALLOWED_PROJECT_SUB = new Set([FILE_FOLDERS.PROJECT_IMAGES, FILE_FOLDERS.PROJECT_FILES]);

    if (!ALLOWED.has(folder)) throw new Error('Invalid request');
    if (folder === FILE_FOLDERS.PROJECTS && subfolder && !ALLOWED_PROJECT_SUB.has(subfolder))
      throw new Error('Invalid request');

    // ✅ block path traversal
    const safeFilename = path.basename(rawFilename);
    if (
      safeFilename !== rawFilename ||
      safeFilename.includes('..') ||
      safeFilename.includes('/') ||
      safeFilename.includes('\\')
    ) {
      throw new Error('Invalid request');
    }
    if (!folder || !safeFilename) throw new Error('Invalid request – missing folder or filename');

    // 💡 החמרת גישה: projectFiles → רק בעלים/אדמין
    if (folder === FILE_FOLDERS.PROJECTS && subfolder === FILE_FOLDERS.PROJECT_FILES) {
      if (!req.user) throw new Error('No token provided');
      const project = await Project.findOne({ 'files.filename': safeFilename }).select('createdBy');
      if (!project) throw new Error('File not found');
      const isOwner = String(project.createdBy) === String(userId);
      const isAdmin = userRole === ROLES.ADMIN;
      if (!isOwner && !isAdmin) throw new Error('Access denied');
    }

    const base = path.join(__dirname, '..', FILE_FOLDERS.UPLOADS);
    const filePath = subfolder
      ? path.join(base, folder, subfolder, safeFilename)
      : path.join(base, folder, safeFilename);

    if (!fs.existsSync(filePath)) throw new Error('File not found');

    // מסמכי אימות — רק אדמין
    if (folder === FILE_FOLDERS.APPROVAL_DOCUMENTS && userRole !== ROLES.ADMIN) {
      throw new Error('Access denied');
    }

    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFile };
