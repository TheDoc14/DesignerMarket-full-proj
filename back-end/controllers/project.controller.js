// back-end/controllers/project.controller.js
const mongoose = require('mongoose');
const Project = require('../models/Project.model');
const { buildFileUrl } = require('../utils/url.utils');
const { pickProjectPublic } = require('../utils/serializers.utils');

const getFileType = (mimetype, filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf' || mimetype.includes('powerpoint') || ext === 'ppt' || ext === 'pptx') return 'presentation';
  if (mimetype.startsWith('text/') || mimetype.includes('word') || mimetype.includes('officedocument') ||
      ext === 'doc' || ext === 'docx' || ext === 'txt') return 'document';
  return 'other';
};

const createProject = async (req, res, next) => {
  try {
    const { title, description, price, category } = req.body;
    const mainImageIndex = Number(req.body.mainImageIndex);

    if (!req.files || req.files.length === 0) throw new Error('No files uploaded');
    if (isNaN(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= req.files.length) throw new Error('Invalid mainImageIndex');

    const priceNum = Number(price);
    if (isNaN(priceNum)) throw new Error('Price must be a valid number');

    const files = req.files.map(file => {
      const id = new mongoose.Types.ObjectId();
      const fileType = getFileType(file.mimetype, file.originalname);
      const subfolder = (fileType === 'image' || fileType === 'video') ? 'projectImages' : 'projectFiles';
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
  } catch (err) { next(err); }
};

// כל הפרויקטים (ציבורי)
const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', '_id role') // לא צריך יותר מזה כאן
      .sort({ createdAt: -1 });

    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const data = projects.map(p => pickProjectPublic(p, { req, viewer }));

    return res.status(200).json({ message: 'Projects fetched successfully', total: data.length, projects: data });
  } catch (err) { next(err); }
};

// פרויקט יחיד (ציבורי — קבצים רגישים רק לבעלים/אדמין)
const getProjectById = async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id).populate('createdBy', '_id role');
    if (!p) throw new Error('Project not found');

    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const data = pickProjectPublic(p, { req, viewer }); // <<--- מעבירים req

    return res.status(200).json({ message: 'Project fetched successfully', project: data });
  } catch (err) { next(err); }
};


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
      req.files.forEach(file => {
        const fileType = getFileType(file.mimetype, file.originalname);
        const subfolder = (fileType === 'image' || fileType === 'video') ? 'projectImages' : 'projectFiles';
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
    const data = pickProjectPublic(p, { req ,viewer });
    return res.status(200).json({ message: 'Project updated successfully', project: data });
  } catch (err) { next(err); }
};

module.exports = { createProject, getAllProjects, getProjectById, updateProject };