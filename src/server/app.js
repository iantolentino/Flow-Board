const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const env = require('./config/environment');

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
      connectSrc: ["'self'"],
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

// Static files - IMPORTANT: Point to correct client directory
app.use(express.static(path.join(__dirname, '../../client/public')));
app.use('/css', express.static(path.join(__dirname, '../../client/css')));
app.use('/js', express.static(path.join(__dirname, '../../client/js')));
app.use('/assets', express.static(path.join(__dirname, '../../client/assets')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    platform: process.env.VERCEL ? 'vercel' : 'local'
  });
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.statusCode || 500,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
