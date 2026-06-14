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
  type: Joi.string().valid('text', 'image', 'file', 'audio', 'system').default('text'),
});

const messageStatusSchema = Joi.object({
  messageId: Joi.string().hex().length(24).required(),
});

const messageEditSchema = Joi.object({
  messageId: Joi.string().hex().length(24).required(),
  content: Joi.string().trim().min(1).max(5000).required(),
});

const conversationReadSchema = Joi.object({
  conversationId: Joi.string().hex().length(24).required(),
});

const validatePayload = (schema, payload) => {
  const { value, error } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    throw new Error(message);
  }

  return value;
};

const registerMessageHandlers = (io, socket) => {
  const userId = socket.user.id;

  socket.on(socketEvents.MESSAGE_SEND, async (payload, callback) => {
    try {
      const value = validatePayload(messageSendSchema, payload);

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

  socket.on(socketEvents.MESSAGE_DELIVERED, async (payload, callback) => {
    try {
      const value = validatePayload(messageStatusSchema, payload);
      const message = await messageService.markMessageAsDelivered(value.messageId, userId);
      const conversationId = message.conversationId.toString();

      io.to(getConversationRoom(conversationId)).emit(socketEvents.MESSAGE_DELIVERED, {
        conversationId,
        messageId: message.id,
        deliveredTo: [userId],
        status: message.status,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          data: {
            message,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to mark socket message delivered', {
        socketId: socket.id,
        userId,
        messageId: payload?.messageId,
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

  socket.on(socketEvents.MESSAGE_EDIT, async (payload, callback) => {
    try {
      const value = validatePayload(messageEditSchema, payload);
      const message = await messageService.editMessage(value.messageId, userId, {
        content: value.content,
      });
      const conversationId = message.conversationId.toString();

      io.to(getConversationRoom(conversationId)).emit(socketEvents.MESSAGE_UPDATED, {
        conversationId,
        message,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          data: {
            message,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to edit socket message', {
        socketId: socket.id,
        userId,
        messageId: payload?.messageId,
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

  socket.on(socketEvents.MESSAGE_DELETE, async (payload, callback) => {
    try {
      const value = validatePayload(messageStatusSchema, payload);
      const message = await messageService.deleteMessage(value.messageId, userId);
      const conversationId = message.conversationId.toString();

      io.to(getConversationRoom(conversationId)).emit(socketEvents.MESSAGE_DELETED, {
        conversationId,
        message,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          data: {
            message,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to delete socket message', {
        socketId: socket.id,
        userId,
        messageId: payload?.messageId,
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

  socket.on(socketEvents.MESSAGE_READ, async (payload, callback) => {
    try {
      const value = validatePayload(messageStatusSchema, payload);
      const message = await messageService.markMessageAsRead(value.messageId, userId);
      const conversationId = message.conversationId.toString();

      io.to(getConversationRoom(conversationId)).emit(socketEvents.MESSAGE_READ_UPDATE, {
        conversationId,
        messageId: message.id,
        readBy: [userId],
        status: message.status,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          data: {
            message,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to mark socket message read', {
        socketId: socket.id,
        userId,
        messageId: payload?.messageId,
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

  socket.on(socketEvents.CONVERSATION_READ, async (payload, callback) => {
    try {
      const value = validatePayload(conversationReadSchema, payload);
      const result = await messageService.markConversationAsRead(value.conversationId, userId);

      io.to(getConversationRoom(value.conversationId)).emit(socketEvents.MESSAGE_READ_UPDATE, {
        conversationId: value.conversationId,
        readBy: [userId],
        updatedCount: result.updatedCount,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          data: result,
        });
      }
    } catch (error) {
      logger.error('Failed to mark socket conversation read', {
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
