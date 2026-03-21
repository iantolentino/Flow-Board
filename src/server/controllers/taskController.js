const taskService = require('../services/taskService');
const { validateTask } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');

class TaskController {
  async getTasks(req, res, next) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      const tasks = await taskService.getUserTasks(req.user.id, {
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        tasks,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getTask(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id, req.user.id);
      if (!task) {
        throw new AppError('Task not found', 404);
      }
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
  
  async createTask(req, res, next) {
    try {
      const validation = validateTask(req.body);
      if (!validation.isValid) {
        throw new AppError(validation.errors.join(', '), 400);
      }
      
      const task = await taskService.createTask({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
  
  async updateTask(req, res, next) {
    try {
      const task = await taskService.updateTask(
        req.params.id,
        req.user.id,
        req.body
      );
      
      if (!task) {
        throw new AppError('Task not found or unauthorized', 404);
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
  
  async deleteTask(req, res, next) {
    try {
      const deleted = await taskService.deleteTask(req.params.id, req.user.id);
      if (!deleted) {
        throw new AppError('Task not found or unauthorized', 404);
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();