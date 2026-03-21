const budgetService = require('../services/budgetService');
const { validateBudgetEntry } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');

class BudgetController {
  async getEntries(req, res, next) {
    try {
      const { start_date, end_date, limit = 100, offset = 0 } = req.query;
      const entries = await budgetService.getUserEntries(req.user.id, {
        startDate: start_date,
        endDate: end_date,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        entries,
        pagination: { limit: parseInt(limit), offset: parseInt(offset) }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async addEntry(req, res, next) {
    try {
      const validation = validateBudgetEntry(req.body);
      if (!validation.isValid) {
        throw new AppError(validation.errors.join(', '), 400);
      }
      
      const entry = await budgetService.addEntry({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  }
  
  async getSummary(req, res, next) {
    try {
      const summary = await budgetService.getSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
  
  async updateTotalMoney(req, res, next) {
    try {
      const { total_money } = req.body;
      if (total_money === undefined || total_money < 0) {
        throw new AppError('Valid total money amount is required', 400);
      }
      
      const result = await budgetService.updateTotalMoney(req.user.id, total_money);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  async deleteEntry(req, res, next) {
    try {
      const deleted = await budgetService.deleteEntry(req.params.id, req.user.id);
      if (!deleted) {
        throw new AppError('Entry not found', 404);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  
  async exportExcel(req, res, next) {
    try {
      const buffer = await budgetService.exportToExcel(req.user.id);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=budget-${Date.now()}.xlsx`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BudgetController();