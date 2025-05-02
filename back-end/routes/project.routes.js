const express = require('express');
const { createProject, getAllProjects } = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/multer.middleware');

const router = express.Router();

// יצירת פרויקט (דורש התחברות)
router.post('/', authMiddleware, upload.array('files', 10), createProject);

// שליפת כל הפרויקטים (פתוח)
router.get('/', getAllProjects);

module.exports = router;
