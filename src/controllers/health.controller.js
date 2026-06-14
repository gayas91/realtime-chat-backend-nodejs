const mongoose = require('mongoose');
const { redisClient } = require('../config/redis');
const asyncHandler = require('../utils/asyncHandler');

const getHealth = asyncHandler(async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

module.exports = {
  getHealth,
};
