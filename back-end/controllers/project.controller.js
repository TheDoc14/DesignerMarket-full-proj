// back-end/controllers/project.controller.js

const mongoose = require('mongoose');
const Project = require('../models/Project.model');

/**
 * פונקציה לזיהוי סוג הקובץ לפי mime-type
 */
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf' || mimetype.includes('powerpoint')) return 'presentation';
  return 'other';
};

/**
 * יצירת פרויקט חדש על ידי משתמש עם הרשאות מתאימות (student/designer)
 */
const createProject = async (req, res, next) => {
  try {
    const { title, description, price, category } = req.body;
    const mainImageIndex = Number(req.body.mainImageIndex);

    // בדיקות תקינות בסיסיות
    if (!req.files || req.files.length === 0) throw new Error('No files uploaded');
    if (isNaN(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= req.files.length) throw new Error('Invalid mainImageIndex');

    const priceNum = Number(price);
    if (isNaN(priceNum)) throw new Error('Price must be a valid number');

    // מיפוי הקבצים למבנה שמור
    const files = req.files.map(file => {
      const id = new mongoose.Types.ObjectId();
      return {
        _id: id,
        filename: file.filename,
        fileType: getFileType(file.mimetype),
        path: file.path,
      };
    });

    // בדיקת שהתמונה הראשית היא אכן תמונה
    const mainFile = files[mainImageIndex];
    if (mainFile.fileType !== 'image') throw new Error('Main file must be an image');

    // יצירת הפרויקט ושמירתו במסד הנתונים
    const project = await Project.create({
      title,
      description,
      price: priceNum,
      category,
      createdBy: req.user.id,
      files,
      mainImageId: mainFile._id,
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });

  } catch (err) {next(err);}
};

/**
 * שליפת כל הפרויקטים במערכת (פתוח לכל המשתמשים)
 */
const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Projects fetched successfully',
      total: projects.length,
      projects,
    });
  } catch (err) {next(err);}
};

// ✅ ייצוא מרוכז לפי הגישה שלך (const + error handling עקבי)
module.exports = {createProject,getAllProjects,};