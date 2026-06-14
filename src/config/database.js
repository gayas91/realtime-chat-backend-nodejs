const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectMongoDB = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongo.uri, {
    autoIndex: !config.isProduction,
  });

  logger.info('MongoDB connected');
};

const disconnectMongoDB = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
};
