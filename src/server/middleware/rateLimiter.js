const rateLimit = require('express-rate-limit');
const env = require('../config/environment');

class RateLimiter {
  createLimiter(options = {}) {
    const config = {
      windowMs: options.windowMs || parseInt(env.get('RATE_LIMIT_WINDOW', '900000')),
      max: options.max || parseInt(env.get('RATE_LIMIT_MAX', '100')),
      message: options.message || 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false
    };
    
    return rateLimit(config);
  }
  
  authLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: 'Too many authentication attempts, please try again later',
      skipSuccessfulRequests: true
    });
  }
  
  apiLimiter() {
    return this.createLimiter({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60,
      message: 'Too many API requests'
    });
  }
  
  vaultLimiter() {
    return this.createLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 20,
      message: 'Too many vault operations'
    });
  }
}

module.exports = new RateLimiter();