const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/register', rateLimiter.authLimiter(), authController.register);
router.post('/login', rateLimiter.authLimiter(), authController.login);
router.post('/guest', authController.guestLogin);
router.get('/validate', authController.validate);

module.exports = router;