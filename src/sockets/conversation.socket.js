const socketEvents = require('../constants/socketEvents');
const conversationService = require('../services/conversation.service');
const logger = require('../utils/logger');

const getConversationRoom = (conversationId) => `conversation:${conversationId}`;

const registerConversationHandlers = (_io, socket) => {
  void _io;
  const userId = socket.user.id;

  socket.on(socketEvents.CONVERSATION_JOIN, async (payload, callback) => {
    try {
      const conversationId = payload?.conversationId;

      await conversationService.ensureParticipant(conversationId, userId);
      socket.join(getConversationRoom(conversationId));

      const response = {
        success: true,
        data: {
          conversationId,
        },
      };

      if (typeof callback === 'function') {
        callback(response);
      }
    } catch (error) {
      logger.warn('Failed to join conversation room', {
        socketId: socket.id,
        userId,
        conversationId: payload?.conversationId,
        message: error.message,
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          message: error.message,
        });
      }
    }
  });

  socket.on(socketEvents.CONVERSATION_LEAVE, (payload, callback) => {
    const conversationId = payload?.conversationId;

    socket.leave(getConversationRoom(conversationId));

    if (typeof callback === 'function') {
      callback({
        success: true,
        data: {
          conversationId,
        },
      });
    }
  });
};

module.exports = {
  getConversationRoom,
  registerConversationHandlers,
};
