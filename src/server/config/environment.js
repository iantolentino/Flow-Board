const fs = require('fs');
const path = require('path');

class EnvironmentConfig {
  constructor() {
    this.env = this.detectEnvironment();
    this.loadEnvFile();
    this.validate();
  }

  detectEnvironment() {
    // Auto-detect if running in Docker
    if (fs.existsSync('/.dockerenv')) {
      return 'docker';
    }
    // Auto-detect if running in production
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }
    // Default to development
    return 'development';
  }

  loadEnvFile() {
    const envPath = path.join(__dirname, '../../../.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    }
    
    // Set defaults based on environment
    if (this.env === 'docker') {
      process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myboard:myboard123@postgres:5432/myboard';
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'docker-default-secret-please-change-in-production';
    } else if (this.env === 'development') {
      // Use SQLite for local development - no PostgreSQL needed!
      process.env.USE_SQLITE = 'true';
      process.env.DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../../data/myboard.db');
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-for-testing-only';
    }
    
    // Common defaults
    process.env.PORT = process.env.PORT || '3000';
    process.env.ENABLE_GUEST_MODE = process.env.ENABLE_GUEST_MODE || 'true';
    process.env.LOG_LEVEL = process.env.LOG_LEVEL || (this.env === 'development' ? 'debug' : 'info');
  }

  validate() {
    const required = ['JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0 && this.env !== 'development') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  get(key, defaultValue = null) {
    return process.env[key] || defaultValue;
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isProduction() {
    return this.env === 'production';
  }

  isDocker() {
    return this.env === 'docker';
  }

  getPort() {
    return parseInt(this.get('PORT', '3000'), 10);
  }

  getJwtSecret() {
    return this.get('JWT_SECRET');
  }

  getDatabaseConfig() {
    if (this.get('USE_SQLITE') === 'true') {
      return {
        dialect: 'sqlite',
        storage: this.get('DATABASE_PATH', './data/myboard.db')
      };
    }
    return {
      dialect: 'postgres',
      connectionString: this.get('DATABASE_URL')
    };
  }
}

module.exports = new EnvironmentConfig();