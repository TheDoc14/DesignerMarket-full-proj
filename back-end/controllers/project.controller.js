const Project = require('../models/Project.model');

// יצירת פרויקט
const createProject = async (req, res) => {
  try {
    const { title, description, price, category, mainImageIndex } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      fileType: getFileType(file.mimetype),
      path: file.path
    }));

    // ודא שהאינדקס שנבחר הוא תמונה
    if (files[mainImageIndex].fileType !== 'image') {
      return res.status(400).json({ error: 'Main file must be an image' });
    }

    const newProject = new Project({
      title,
      description,
      price,
      category,
      createdBy: req.user.id,
      files,
      mainImageId: files[mainImageIndex]._id,
    });

    await newProject.save();

    res.status(201).json({ message: 'Project created successfully', project: newProject });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server error creating project' });
  }
};

// שליפת כל הפרויקטים
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('createdBy', 'username email');
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Server error fetching projects' });
  }
};

// פונקציה לזיהוי סוג הקובץ
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'presentation';
  return 'other';
};

module.exports = { createProject, getAllProjects };
