const http = require('http');

const app = require('./app');
const config = require('./config/env');
const { connectMongoDB, disconnectMongoDB } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const initializeSocketServer = require('./sockets');
const logger = require('./utils/logger');

const server = http.createServer(app);
let io;

const startServer = async () => {
  try {
    await connectMongoDB();
    await connectRedis();
    io = await initializeSocketServer(server);

    server.listen(config.port, () => {
      logger.info(`${config.appName} listening on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully`);

  server.close(async () => {
    try {
      if (io) {
        io.close();
        await io.closeRedisAdapterClients?.();
      }
      await disconnectRedis();
      await disconnectMongoDB();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { message: error.message, stack: error.stack });
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
