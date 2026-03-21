const AuthService = require('../services/authService');
const { validateLogin, validateRegistration } = require('../utils/validators');

class AuthController {
  async register(req, res, next) {
    try {
      const validation = validateRegistration(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ errors: validation.errors });
      }

      const { user, token } = await AuthService.register(req.body);
      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const validation = validateLogin(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ errors: validation.errors });
      }

      const { user, token } = await AuthService.login(req.body.email, req.body.password);
      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async guestLogin(req, res, next) {
    try {
      const guestUser = {
        id: `guest_${Date.now()}`,
        username: `Guest_${Math.random().toString(36).substring(7)}`,
        email: null,
        isGuest: true
      };
      
      const token = AuthService.generateToken(guestUser);
      res.json({ user: guestUser, token, isGuest: true });
    } catch (error) {
      next(error);
    }
  }

  async validate(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await AuthService.validateToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();