const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const env = require('../config/environment');
const { AppError } = require('../middleware/errorHandler');

class AuthService {
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      isGuest: user.isGuest || false
    };
    
    return jwt.sign(payload, env.getJwtSecret(), {
      expiresIn: '7d',
      issuer: 'myboard',
      audience: 'myboard-users'
    });
  }
  
  async register(userData) {
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }
    
    const user = await User.create(userData);
    const token = this.generateToken(user);
    
    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
  
  async login(email, password) {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const isValid = await User.validatePassword(user, password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }
    
    await User.updateLastLogin(user.id);
    const token = this.generateToken(user);
    
    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
  
  async guestLogin() {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const guestUser = {
      id: guestId,
      username: `Guest_${Math.random().toString(36).substring(2, 8)}`,
      email: null,
      isGuest: true,
      created_at: new Date().toISOString()
    };
    
    const token = this.generateToken(guestUser);
    return { user: guestUser, token, isGuest: true };
  }
  
  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, env.getJwtSecret(), {
        issuer: 'myboard',
        audience: 'myboard-users'
      });
      
      if (decoded.isGuest) {
        return decoded;
      }
      
      const user = await User.findById(decoded.id);
      return user;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthService();