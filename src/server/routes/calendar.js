const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAuth);

router.get('/tasks', calendarController.getMonthTasks);

module.exports = router;