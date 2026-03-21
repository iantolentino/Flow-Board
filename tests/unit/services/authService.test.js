const authService = require('../../../src/server/services/authService');
const User = require('../../../src/server/models/User');
const { AppError } = require('../../../src/server/middleware/errorHandler');

// Mock User model
jest.mock('../../../src/server/models/User');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date()
      };

      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(User.create).toHaveBeenCalledWith(userData);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      };

      User.findByEmail.mockResolvedValue({ id: '456', email: 'existing@example.com' });

      await expect(authService.register(userData)).rejects.toThrow(AppError);
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(true);
      User.updateLastLogin.mockResolvedValue();

      const result = await authService.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(User.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw error with invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      User.findByEmail.mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toThrow(AppError);
    });
  });

  describe('guestLogin', () => {
    it('should create guest user successfully', async () => {
      const result = await authService.guestLogin();

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.isGuest).toBe(true);
      expect(result.user.username).toMatch(/^Guest_/);
      expect(result.user.id).toMatch(/^guest_/);
    });
  });
});