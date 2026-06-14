const Joi = require('joi');

const socketEvents = require('../constants/socketEvents');
const conversationService = require('../services/conversation.service');
const messageService = require('../services/message.service');
const presenceService = require('../services/presence.service');
const logger = require('../utils/logger');
const { getConversationRoom } = require('./conversation.socket');

const messageSendSchema = Joi.object({
  conversationId: Joi.string().hex().length(24).required(),
  content: Joi.string().trim().min(1).max(5000).required(),
  type: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
});

const registerMessageHandlers = (io, socket) => {
  const userId = socket.user.id;

  socket.on(socketEvents.MESSAGE_SEND, async (payload, callback) => {
    try {
      const { value, error } = messageSendSchema.validate(payload, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const message = error.details.map((detail) => detail.message).join(', ');
        throw new Error(message);
      }

      const conversation = await conversationService.ensureParticipant(
        value.conversationId,
        userId
      );
      const message = await messageService.createMessage(value.conversationId, userId, {
        content: value.content,
        type: value.type,
      });
      const room = getConversationRoom(value.conversationId);

      socket.join(room);
      io.to(room).emit(socketEvents.MESSAGE_NEW, {
        conversationId: value.conversationId,
        message,
      });

      const participantIds = messageService
        .getParticipantIds(conversation)
        .filter((participantId) => participantId !== userId);
      const presence = await presenceService.getPresence(participantIds);
      const onlineParticipantIds = participantIds.filter(
        (participantId) => presence[participantId] === 'online'
      );

      await messageService.markDeliveredForUsers(message.id, onlineParticipantIds);

      if (onlineParticipantIds.length) {
        io.to(room).emit(socketEvents.MESSAGE_DELIVERED, {
          conversationId: value.conversationId,
          messageId: message.id,
          deliveredTo: onlineParticipantIds,
        });
      }

      if (typeof callback === 'function') {
        callback({
          success: true,
          data: {
            message,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to send socket message', {
        socketId: socket.id,
        userId,
        conversationId: payload?.conversationId,
        message: error.message,
        stack: error.stack,
      });

      if (typeof callback === 'function') {
        callback({
          success: false,
          message: error.message,
        });
      }
    }
  });
};

module.exports = registerMessageHandlers;
