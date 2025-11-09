const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth.middleware');
const { uploadProject } = require('../middleware/multer.middleware');
const { createProject, getAllProjects } = require('../controllers/project.controller');
const { permit } = require('../middleware/role.middleware');

// יצירת פרויקט – דורש התחברות
router.post('/', auth, uploadProject.array('files', 10), permit('student','designer'), createProject);

// שליפת כל הפרויקטים – פתוח לכולם
router.get('/', auth,permit('admin','student','designer','customer'), getAllProjects);

module.exports = router;