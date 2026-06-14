const socketEvents = require('../constants/socketEvents');
const presenceService = require('../services/presence.service');
const logger = require('../utils/logger');

const registerPresenceHandlers = (io, socket) => {
  const userId = socket.user.id;

  socket.on(socketEvents.PRESENCE_GET, async (payload, callback) => {
    try {
      const userIds = Array.isArray(payload?.userIds) ? payload.userIds : [];
      const presence = await presenceService.getPresence(userIds);
      const response = {
        success: true,
        data: presence,
      };

      if (typeof callback === 'function') {
        callback(response);
      }
    } catch (error) {
      logger.error('Failed to get presence', {
        socketId: socket.id,
        userId,
        message: error.message,
        stack: error.stack,
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to get presence',
        });
      }
    }
  });

  socket.on(socketEvents.DISCONNECT, async (reason) => {
    try {
      const becameOffline = await presenceService.markUserOffline(userId, socket.id);

      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId,
        reason,
      });

      if (becameOffline) {
        // TODO: Add a dedicated lastSeenAt field before writing presence disconnect time to User.
        io.emit(socketEvents.USER_OFFLINE, { userId });
      }
    } catch (error) {
      logger.error('Failed to update presence on disconnect', {
        socketId: socket.id,
        userId,
        message: error.message,
        stack: error.stack,
      });
    }
  });
};

module.exports = registerPresenceHandlers;
