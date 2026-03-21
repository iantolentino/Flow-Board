const logger = require('../utils/logger');
const env = require('../config/environment');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });
  
  // Development vs Production error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };
  
  if (env.isDevelopment()) {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }
  
  // Handle specific error types
  if (err.code === '23505') { // PostgreSQL duplicate key
    errorResponse.error = 'Duplicate entry detected';
    errorResponse.status = 409;
    return res.status(409).json(errorResponse);
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    errorResponse.error = 'Referenced resource not found';
    errorResponse.status = 400;
    return res.status(400).json(errorResponse);
  }
  
  if (err.name === 'JsonWebTokenError') {
    errorResponse.error = 'Invalid authentication token';
    errorResponse.status = 401;
    return res.status(401).json(errorResponse);
  }
  
  if (err.name === 'TokenExpiredError') {
    errorResponse.error = 'Authentication token expired';
    errorResponse.status = 401;
    return res.status(401).json(errorResponse);
  }
  
  if (err.name === 'ValidationError') {
    errorResponse.error = 'Validation Error';
    errorResponse.status = 400;
    errorResponse.details = err.details;
    return res.status(400).json(errorResponse);
  }
  
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
module.exports.AppError = AppError;