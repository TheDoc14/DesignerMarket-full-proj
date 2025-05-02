const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth.middleware');
const upload  = require('../middleware/multer.middleware');
const { createProject, getAllProjects } = require('../controllers/project.controller');

// יצירת פרויקט – דורש התחברות
router.post('/', auth, upload.array('files', 10), createProject);

// שליפת כל הפרויקטים – פתוח לכולם
router.get('/', getAllProjects);

module.exports = router;
