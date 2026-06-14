const jwt = require('jsonwebtoken');

const config = require('../config/env');
const User = require('../models/User');
const logger = require('../utils/logger');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return next(new Error('User is not authorized'));
    }

    socket.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    logger.warn('Socket authentication failed', { message: error.message });
    return next(new Error('Invalid or expired access token'));
  }
};

module.exports = socketAuth;
