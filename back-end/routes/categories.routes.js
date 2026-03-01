// routes/categories.routes.js
const express = require('express');
const router = express.Router();

const {authMiddleware} = require('../middleware/auth.middleware');
const {validate} = require('../middleware/validate.middleware');

const { listCategoriesQuery } = require('../validators/categories.validators');
const { listCategories } = require('../controllers/categories.controller');

// רק מחובר יכול למשוך
router.use(authMiddleware);

// GET /api/categories?q=&page=&limit=
router.get('/', listCategoriesQuery, validate, listCategories);

module.exports = router;