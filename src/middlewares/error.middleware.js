const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, _next) => {
  void _next;
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational !== false;
  const message = isOperational ? err.message : 'Internal server error';

  logger.error(message, {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    stack: err.stack,
    details: err.details,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details && { details: err.details }),
    ...(!config.isProduction && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
