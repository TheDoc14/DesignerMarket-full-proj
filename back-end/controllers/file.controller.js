// back-end/controllers/file.controller.js
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project.model');

const getFile = async (req, res, next) => {
  try {
    const parts = req.path.split('/').filter(Boolean);
    const folder = parts[0];
    const subfolder = parts.length === 3 ? parts[1] : null;
    const filename = decodeURIComponent(parts[parts.length - 1]);
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!folder || !filename) throw new Error('Invalid request – missing folder or filename');

    // 💡 החמרת גישה: projectFiles → רק בעלים/אדמין
    if (folder === 'projects' && subfolder === 'projectFiles') {
      if (!req.user) throw new Error('No token provided');
      const project = await Project.findOne({ 'files.filename': filename }).select('createdBy');
      if (!project) throw new Error('File not found');
      const isOwner = String(project.createdBy) === String(userId);
      const isAdmin = userRole === 'admin';
      if (!isOwner && !isAdmin) throw new Error('Access denied');
    }

    const base = path.join(__dirname, '..', 'uploads');
    const filePath = subfolder
      ? path.join(base, folder, subfolder, filename)
      : path.join(base, folder, filename);

    if (!fs.existsSync(filePath)) throw new Error('File not found');

    // מסמכי אימות — רק אדמין
    if (folder === 'approvalDocuments' && userRole !== 'admin') {
      throw new Error('Access denied');
    }

    return res.sendFile(filePath);
  } catch (err) { next(err); }
};

module.exports = { getFile };