const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAuth);

router.get('/entries', budgetController.getEntries);
router.post('/entries', budgetController.addEntry);
router.delete('/entries/:id', budgetController.deleteEntry);
router.get('/summary', budgetController.getSummary);
router.put('/total-money', budgetController.updateTotalMoney);
router.get('/export/excel', budgetController.exportExcel);

module.exports = router;