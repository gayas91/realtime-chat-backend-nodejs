const { createClient } = require('redis');
const config = require('./env');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (error) => {
  logger.error('Redis client error', { message: error.message, stack: error.stack });
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting');
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info('Redis connected');
  }
};

const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
};

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
};
