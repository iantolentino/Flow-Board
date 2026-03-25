class EnvironmentConfig {
  constructor() {
    this.env = this.detectEnvironment();
    this.loadEnvFile();
  }

  detectEnvironment() {
    if (process.env.VERCEL) {
      return 'vercel';
    }
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }
    return 'development';
  }

  loadEnvFile() {
    if (this.env === 'vercel') {
      // On Vercel, ensure we have a JWT secret
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️  JWT_SECRET not set, using default (INSECURE)');
        process.env.JWT_SECRET = 'vercel-default-secret-change-me';
      }
    }
    
    process.env.PORT = process.env.PORT || '3000';
    process.env.ENABLE_GUEST_MODE = process.env.ENABLE_GUEST_MODE || 'true';
  }

  get(key, defaultValue = null) {
    return process.env[key] || defaultValue;
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isProduction() {
    return this.env === 'production' || this.env === 'vercel';
  }

  isVercel() {
    return this.env === 'vercel';
  }

  getPort() {
    return parseInt(this.get('PORT', '3000'), 10);
  }

  getJwtSecret() {
    return this.get('JWT_SECRET');
  }
}

module.exports = new EnvironmentConfig();
