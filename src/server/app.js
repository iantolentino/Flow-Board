const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const env = require('./config/environment');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const vaultRoutes = require('./routes/vault');
const budgetRoutes = require('./routes/budget');
const calendarRoutes = require('./routes/calendar');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: env.get('CORS_ORIGINS', '*').split(','),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../../client/public')));
app.use('/css', express.static(path.join(__dirname, '../../client/css')));
app.use('/js', express.static(path.join(__dirname, '../../client/js')));
app.use('/assets', express.static(path.join(__dirname, '../../client/assets')));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// Rate limiting
app.use('/api/', rateLimiter.apiLimiter());

// Health check endpoint
app.get('/health', (req, res) => {
  const db = require('./config/database');
  const pool = db.pool;
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: pool ? 'connected' : 'disconnected'
    },
    version: process.env.npm_package_version || '2.0.0'
  };
  
  res.status(200).json(health);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/calendar', calendarRoutes);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/public/index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;