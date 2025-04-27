const express = require('express');
const { registerUser, loginUser } = require('../controllers/auth.controller');

const router = express.Router();

// רישום משתמש
router.post('/register', registerUser);

// התחברות משתמש
router.post('/login', loginUser);

module.exports = router;
