const vaultService = require('../services/vaultService');
const { validateVaultEntry } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');

class VaultController {
  async getEntries(req, res, next) {
    try {
      const entries = await vaultService.getUserEntries(req.user.id);
      // Return metadata only, passwords are encrypted
      const sanitized = entries.map(entry => ({
        id: entry.id,
        site_name: entry.site_name,
        username: entry.username,
        created_at: entry.created_at
      }));
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  }
  
  async addEntry(req, res, next) {
    try {
      const validation = validateVaultEntry(req.body);
      if (!validation.isValid) {
        throw new AppError(validation.errors.join(', '), 400);
      }
      
      const entry = await vaultService.addEntry({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json({
        id: entry.id,
        site_name: entry.site_name,
        username: entry.username,
        created_at: entry.created_at
      });
    } catch (error) {
      next(error);
    }
  }
  
  async decryptEntry(req, res, next) {
    try {
      const password = await vaultService.decryptEntry(req.params.id, req.user.id);
      if (!password) {
        throw new AppError('Entry not found or unauthorized', 404);
      }
      
      res.json({ password });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteEntry(req, res, next) {
    try {
      const deleted = await vaultService.deleteEntry(req.params.id, req.user.id);
      if (!deleted) {
        throw new AppError('Entry not found', 404);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VaultController();