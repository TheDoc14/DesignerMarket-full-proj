// back-end/controllers/file.controller.js
const fs = require('fs');
const path = require('path');

const Project = require('../models/Project.model');
const Order = require('../models/Order.model');

const { FILE_FOLDERS } = require('../constants/files.constants');
const { PERMS } = require('../constants/permissions.constants');

/**
 * 📥 getFile
 * מגיש קבצים מתוך uploads דרך /api/files/... בצורה מבוקרת.
 *
 * כללים:
 * - profileImages + projectImages: פתוח לציבור (routes בלי auth)
 * - projectFiles: דורש JWT + (owner או purchased) + bypass למי שיש הרשאה מתאימה
 * - approvalDocuments: דורש JWT + permission files.approvalDocs.read
 *
 * חשוב: ה־routes כבר מגינים עם permitPerm, אבל כאן יש defense-in-depth כדי למנוע פתיחה מקרית.
 */
const getFile = async (req, res, next) => {
  try {
    const parts = req.path.split('/').filter(Boolean);
    const folder = parts[0]; // profileImages / approvalDocuments / projects
    const subfolder = parts.length === 3 ? parts[1] : null; // projectImages / projectFiles
    const rawFilename = decodeURIComponent(parts[parts.length - 1]);

    const userId = req.user?.id;

    const ALLOWED = new Set([
      FILE_FOLDERS.PROFILE_IMAGES,
      FILE_FOLDERS.APPROVAL_DOCUMENTS,
      FILE_FOLDERS.PROJECTS,
    ]);
    const ALLOWED_PROJECT_SUB = new Set([FILE_FOLDERS.PROJECT_IMAGES, FILE_FOLDERS.PROJECT_FILES]);

    if (!ALLOWED.has(folder)) throw new Error('Invalid request');
    if (folder === FILE_FOLDERS.PROJECTS && subfolder && !ALLOWED_PROJECT_SUB.has(subfolder)) {
      throw new Error('Invalid request');
    }

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

    // ✅ permissions helpers
    const userPerms = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
    const isAdmin = userPerms.includes(PERMS.ADMIN_PANEL_ACCESS);
    const canReadApprovalDocs = userPerms.includes(PERMS.FILES_APPROVALDOCS_READ);

    // 🔒 approvalDocuments – permission only
    if (folder === FILE_FOLDERS.APPROVAL_DOCUMENTS) {
      if (!req.user) {
        const err = new Error('No token provided');
        err.statusCode = 401;
        throw err;
      }
      if (!canReadApprovalDocs) {
        const err = new Error('Access denied');
        err.statusCode = 403;
        throw err;
      }
    }

    // 🔒 projectFiles – JWT + (owner/purchase) unless admin
    if (folder === FILE_FOLDERS.PROJECTS && subfolder === FILE_FOLDERS.PROJECT_FILES) {
      if (!req.user) {
        const err = new Error('No token provided');
        err.statusCode = 401;
        throw err;
      }

      const project = await Project.findOne({ 'files.filename': safeFilename }).select('createdBy');
      if (!project) throw new Error('File not found');

      const isOwner = String(project.createdBy) === String(userId);

      // ✅ bypass ONLY for admin panel access

      let hasPurchased = false;
      if (!isAdmin && !isOwner && userId) {
        hasPurchased = await Order.exists({
          buyerId: userId,
          projectId: project._id,
          status: { $in: ['PAID', 'PAYOUT_SENT'] },
        });
      }

      // ✅ deny only if not admin AND not owner AND not purchased
      if (!isAdmin && !isOwner && !hasPurchased) throw new Error('Access denied');
    }

    const base = path.join(__dirname, '..', FILE_FOLDERS.UPLOADS);
    const filePath = subfolder
      ? path.join(base, folder, subfolder, safeFilename)
      : path.join(base, folder, safeFilename);

    if (!fs.existsSync(filePath)) throw new Error('File not found');

    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFile };
