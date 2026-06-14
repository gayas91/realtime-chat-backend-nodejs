const path = require('path');
const winston = require('winston');
const config = require('../config/env');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: config.isProduction
      ? logFormat
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

if (config.isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
    })
  );
}

const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: {
    service: config.appName,
    environment: config.env,
  },
  format: logFormat,
  transports,
  exitOnError: false,
});

module.exports = logger;
