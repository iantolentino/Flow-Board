const taskService = require('../../../src/server/services/taskService');
const Task = require('../../../src/server/models/Task');

jest.mock('../../../src/server/models/Task');

describe('TaskService', () => {
  const mockUserId = 'user-123';
  const mockTask = {
    id: 'task-123',
    user_id: mockUserId,
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserTasks', () => {
    it('should return user tasks with options', async () => {
      const options = { status: 'todo', limit: 10, offset: 0 };
      Task.findByUserId.mockResolvedValue([mockTask]);

      const result = await taskService.getUserTasks(mockUserId, options);

      expect(result).toHaveLength(1);
      expect(Task.findByUserId).toHaveBeenCalledWith(mockUserId, options);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const taskData = {
        userId: mockUserId,
        title: 'New Task',
        description: 'New Description',
        priority: 'high',
        status: 'todo'
      };

      Task.create.mockResolvedValue({ ...mockTask, ...taskData });

      const result = await taskService.createTask(taskData);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('New Task');
      expect(Task.create).toHaveBeenCalledWith(taskData);
    });
  });

  describe('updateTask', () => {
    it('should update existing task', async () => {
      const taskId = 'task-123';
      const updates = { status: 'done', priority: 'high' };

      Task.update.mockResolvedValue({ ...mockTask, ...updates });

      const result = await taskService.updateTask(taskId, mockUserId, updates);

      expect(result.status).toBe('done');
      expect(Task.update).toHaveBeenCalledWith(taskId, mockUserId, updates);
    });

    it('should return null if task not found', async () => {
      Task.update.mockResolvedValue(null);

      const result = await taskService.updateTask('invalid-id', mockUserId, {});

      expect(result).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      Task.delete.mockResolvedValue({ id: 'task-123' });

      const result = await taskService.deleteTask('task-123', mockUserId);

      expect(result).toHaveProperty('id');
      expect(Task.delete).toHaveBeenCalledWith('task-123', mockUserId);
    });
  });
});