const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../config/env');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn,
    }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      tokenType: 'refresh',
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    }
  );

const getRefreshTokenExpiry = (token) => {
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    throw new ApiError(500, 'Unable to calculate refresh token expiry', false);
  }

  return new Date(decoded.exp * 1000);
};

const createTokenPair = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // TODO: Store a hash of refresh tokens in production so leaked database rows cannot be replayed.
  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiry(refreshToken),
  });

  return {
    accessToken,
    refreshToken,
  };
};

const sanitizeUser = (user) => user.toJSON();

const register = async ({ name, email, password }) => {
  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const tokens = await createTokenPair(user);

  return {
    user: sanitizeUser(user),
    tokens,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'User account is inactive');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await createTokenPair(user);

  return {
    user: sanitizeUser(user),
    tokens,
  };
};

const refreshToken = async (token) => {
  let decoded;

  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  if (decoded.tokenType !== 'refresh') {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const storedToken = await RefreshToken.findOne({
    token,
    userId: decoded.sub,
    isRevoked: false,
  });

  if (!storedToken || storedToken.expiresAt <= new Date()) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User is not authorized');
  }

  storedToken.isRevoked = true;
  await storedToken.save();

  const tokens = await createTokenPair(user);

  return {
    user: sanitizeUser(user),
    tokens,
  };
};

const logout = async (token) => {
  const storedToken = await RefreshToken.findOne({ token });

  if (storedToken && !storedToken.isRevoked) {
    storedToken.isRevoked = true;
    await storedToken.save();
  }
};

const getAuthenticatedUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User is not authorized');
  }

  return sanitizeUser(user);
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getAuthenticatedUser,
};
