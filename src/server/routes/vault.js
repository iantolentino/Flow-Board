const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAuth);

router.get('/entries', vaultController.getEntries);
router.post('/entries', vaultController.addEntry);
router.get('/entries/:id/decrypt', vaultController.decryptEntry);
router.delete('/entries/:id', vaultController.deleteEntry);

module.exports = router;