const taskService = require('../services/taskService');
const { AppError } = require('../middleware/errorHandler');

class CalendarController {
  async getMonthTasks(req, res, next) {
    try {
      const { year, month } = req.query;
      
      if (!year || !month) {
        throw new AppError('Year and month are required', 400);
      }
      
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      const tasks = await taskService.getCalendarTasks(
        req.user.id,
        startDate,
        endDate
      );
      
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CalendarController();