const winston = require('winston');
const path = require('path');
const env = require('../config/environment');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'ISO8601' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  })
);

const logger = winston.createLogger({
  level: env.get('LOG_LEVEL', 'info'),
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../../logs/error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../../logs/combined.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

if (env.isDevelopment() || env.get('LOG_FORMAT') === 'simple') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  logger.add(new winston.transports.Console({
    format: logFormat
  }));
}

module.exports = logger;