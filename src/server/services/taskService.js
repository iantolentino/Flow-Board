const Task = require('../models/Task');

class TaskService {
  async getUserTasks(userId, options) {
    return await Task.findByUserId(userId, options);
  }
  
  async getTaskById(taskId, userId) {
    const tasks = await Task.findByUserId(userId, { limit: 1 });
    return tasks.find(t => t.id === taskId) || null;
  }
  
  async createTask(taskData) {
    return await Task.create(taskData);
  }
  
  async updateTask(taskId, userId, updates) {
    return await Task.update(taskId, userId, updates);
  }
  
  async deleteTask(taskId, userId) {
    return await Task.delete(taskId, userId);
  }
  
  async getCalendarTasks(userId, startDate, endDate) {
    return await Task.getCalendarTasks(userId, startDate, endDate);
  }
}

module.exports = new TaskService();