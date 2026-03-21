const request = require('supertest');
const app = require('../../../src/server/app');
const db = require('../../../src/server/config/database');

describe('Tasks API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Clean up database
    await db.query('DELETE FROM tasks');
    await db.query('DELETE FROM users');

    // Create test user and get token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'taskuser',
        email: 'task@example.com',
        password: 'password123'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await db.end();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high',
          due_date: '2024-12-31'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Task');
      expect(response.body.priority).toBe('high');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing title'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return user tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every(t => t.status === 'todo')).toBe(true);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Task to Update' });
      
      taskId = createResponse.body.id;
    });

    it('should update task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'done',
          priority: 'low'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('done');
      expect(response.body.priority).toBe('low');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Task to Delete' });
      
      taskId = createResponse.body.id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify task is deleted
      const getResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      
      const deletedTask = getResponse.body.tasks.find(t => t.id === taskId);
      expect(deletedTask).toBeUndefined();
    });
  });
});