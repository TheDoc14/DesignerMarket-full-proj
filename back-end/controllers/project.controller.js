// back-end/controllers/project.controller.js

const mongoose = require('mongoose');
const Project = require('../models/Project.model');

// פונקציה לזיהוי סוג הקובץ
function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'presentation';
  return 'other';
}

exports.createProject = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const mainImageIndex = Number(req.body.mainImageIndex);

    // בדיקות קבצים ושדות
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    if (isNaN(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= req.files.length) {
      return res.status(400).json({ error: 'Invalid mainImageIndex' });
    }
    const priceNum = Number(price);
    if (isNaN(priceNum)) {
      return res.status(400).json({ error: 'Price must be a valid number' });
    }

    // מיפוי req.files למערך עם _id, filename, fileType, path
    const files = req.files.map(file => {
      const id = new mongoose.Types.ObjectId();
      return {
        _id: id,
        filename: file.filename,
        fileType: getFileType(file.mimetype),
        path: file.path
      };
    });

    // אימות שהתמונה הראשית היא אכן image
    const mainFile = files[mainImageIndex];
    if (mainFile.fileType !== 'image') {
      return res.status(400).json({ error: 'Main file must be an image' });
    }

    // יצירת הפרויקט ושמירה
    const project = await Project.create({
      title,
      description,
      price: priceNum,
      category,
      createdBy: req.user.id,
      files,
      mainImageId: mainFile._id
    });

    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error creating project' });
  }
};


// שליפת כל הפרויקטים
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error fetching projects' });
  }
};
