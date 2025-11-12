// back-end/routes/project.routes.js
const express = require('express');
const router = express.Router();
const { createProject, getAllProjects, getProjectById, updateProject } = require('../controllers/project.controller');
const auth = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const { uploadProject } = require('../middleware/multer.middleware');
const {tryAuth} = require('../middleware/tryAuth.middleware');

// יצירה – מעצבים/סטודנטים בלבד
router.post('/', auth, permit('designer','student','admin'), uploadProject.array('files', 10), createProject);

// רשימת פרויקטים – ציבורי
router.get('/', getAllProjects);

// פרויקט יחיד – ציבורי (חשיפת קבצים רגישים מותנית בבעלות/אדמין)
router.get('/:id',tryAuth, getProjectById);

// עדכון – בעלים או אדמין
router.put('/:id', auth, permit('designer','student','admin'), uploadProject.array('files', 10), updateProject);
// (אפשר גם PATCH לפי הטעם)

module.exports = router;