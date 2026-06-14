const { createAdapter } = require('@socket.io/redis-adapter');
const { Server } = require('socket.io');

const config = require('../config/env');
const { redisClient } = require('../config/redis');
const socketEvents = require('../constants/socketEvents');
const presenceService = require('../services/presence.service');
const logger = require('../utils/logger');
const {
  registerConversationHandlers,
  registerConversationSocketServer,
} = require('./conversation.socket');
const { registerGroupSocketServer } = require('./group.socket');
const registerMessageHandlers = require('./message.socket');
const registerPresenceHandlers = require('./presence.socket');
const socketAuth = require('./socket.auth');
const registerTypingHandlers = require('./typing.socket');

const createRedisAdapterClients = async () => {
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  pubClient.on('error', (error) => {
    logger.error('Socket.IO Redis adapter pub client error', {
      message: error.message,
      stack: error.stack,
    });
  });

  subClient.on('error', (error) => {
    logger.error('Socket.IO Redis adapter sub client error', {
      message: error.message,
      stack: error.stack,
    });
  });

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    logger.info('Socket.IO Redis adapter connected');

    return {
      pubClient,
      subClient,
    };
  } catch (error) {
    logger.error('Failed to connect Socket.IO Redis adapter clients', {
      message: error.message,
      stack: error.stack,
    });

    await Promise.allSettled([
      pubClient.isOpen ? pubClient.quit() : Promise.resolve(),
      subClient.isOpen ? subClient.quit() : Promise.resolve(),
    ]);

    throw error;
  }
};

const closeRedisAdapterClients = async (pubClient, subClient) => {
  await Promise.allSettled([
    pubClient?.isOpen ? pubClient.quit() : Promise.resolve(),
    subClient?.isOpen ? subClient.quit() : Promise.resolve(),
  ]);
  logger.info('Socket.IO Redis adapter clients disconnected');
};

const initializeSocketServer = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true,
    },
  });
  const { pubClient, subClient } = await createRedisAdapterClients();

  io.adapter(createAdapter(pubClient, subClient));
  io.use(socketAuth);
  registerConversationSocketServer(io);
  registerGroupSocketServer(io);
  io.closeRedisAdapterClients = () => closeRedisAdapterClients(pubClient, subClient);

  io.on(socketEvents.CONNECTION, async (socket) => {
    const userId = socket.user.id;

    try {
      const becameOnline = await presenceService.markUserOnline(userId, socket.id);

      logger.info('Socket connected', {
        socketId: socket.id,
        userId,
      });

      if (becameOnline) {
        io.emit(socketEvents.USER_ONLINE, { userId });
      }

      registerPresenceHandlers(io, socket);
      registerConversationHandlers(io, socket);
      registerMessageHandlers(io, socket);
      registerTypingHandlers(io, socket);
    } catch (error) {
      logger.error('Failed to initialize socket connection', {
        socketId: socket.id,
        userId,
        message: error.message,
        stack: error.stack,
      });
      socket.disconnect(true);
    }
  });

  logger.info('Socket.IO server initialized');

  return io;
};

module.exports = initializeSocketServer;
