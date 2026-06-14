const jwt = require('jsonwebtoken');

const config = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token is required');
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = jwt.verify(token, config.jwt.accessSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User is not authorized');
  }

  req.user = {
    id: user.id,
    role: user.role,
  };

  next();
});

module.exports = {
  authenticate,
};
