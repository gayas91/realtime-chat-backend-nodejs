const { Server } = require('socket.io');

const config = require('../config/env');
const socketEvents = require('../constants/socketEvents');
const presenceService = require('../services/presence.service');
const logger = require('../utils/logger');
const { registerConversationHandlers } = require('./conversation.socket');
const { registerGroupSocketServer } = require('./group.socket');
const registerMessageHandlers = require('./message.socket');
const registerPresenceHandlers = require('./presence.socket');
const socketAuth = require('./socket.auth');
const registerTypingHandlers = require('./typing.socket');

const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true,
    },
  });

  io.use(socketAuth);
  registerGroupSocketServer(io);

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
