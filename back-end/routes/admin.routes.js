// back-end/routes/admin.routes.js
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');

const {
  adminListUsers,
  adminSetUserApproval,
  adminListProjects,
  adminSetProjectPublish,
  adminListReviews,
  adminGetStats,
} = require('../controllers/admin.controller');

router.use(authMiddleware, permit('admin'));

// Users
router.get('/users', adminListUsers);
router.put('/users/:id/approval', adminSetUserApproval);

// Projects
router.get('/projects', adminListProjects);
router.put('/projects/:id/publish', adminSetProjectPublish);

// Reviews
router.get('/reviews', adminListReviews);

// Stats
router.get('/stats', adminGetStats);

module.exports = router;
