const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getAuthenticatedUser(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  me,
};
