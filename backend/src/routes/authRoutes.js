const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe); // Protected route example
router.post('/logout', protect, logout);

module.exports = router;