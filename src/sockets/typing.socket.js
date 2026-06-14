const Joi = require('joi');

const { redisClient } = require('../config/redis');
const socketEvents = require('../constants/socketEvents');
const conversationService = require('../services/conversation.service');
const logger = require('../utils/logger');
const { getConversationRoom } = require('./conversation.socket');

const TYPING_TTL_SECONDS = 5;

const typingSchema = Joi.object({
  conversationId: Joi.string().hex().length(24).required(),
});

const getTypingKey = (conversationId, userId) => `typing:${conversationId}:${userId}`;

const validateTypingPayload = (payload) => {
  const { value, error } = typingSchema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    throw new Error(message);
  }

  return value;
};

const emitTypingEvent = async ({ socket, eventName, payload, isTyping }) => {
  const userId = socket.user.id;
  const { conversationId } = validateTypingPayload(payload);

  await conversationService.ensureParticipant(conversationId, userId);

  const typingKey = getTypingKey(conversationId, userId);

  if (isTyping) {
    await redisClient.set(typingKey, 'true', {
      EX: TYPING_TTL_SECONDS,
    });
  } else {
    await redisClient.del(typingKey);
  }

  socket.to(getConversationRoom(conversationId)).emit(eventName, {
    conversationId,
    userId,
  });

  return {
    conversationId,
  };
};

const registerTypingHandlers = (_io, socket) => {
  void _io;

  socket.on(socketEvents.TYPING_START, async (payload, callback) => {
    try {
      const data = await emitTypingEvent({
        socket,
        eventName: socketEvents.TYPING_START,
        payload,
        isTyping: true,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          data,
        });
      }
    } catch (error) {
      logger.warn('Failed to emit typing start', {
        socketId: socket.id,
        userId: socket.user.id,
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

  socket.on(socketEvents.TYPING_STOP, async (payload, callback) => {
    try {
      const data = await emitTypingEvent({
        socket,
        eventName: socketEvents.TYPING_STOP,
        payload,
        isTyping: false,
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          data,
        });
      }
    } catch (error) {
      logger.warn('Failed to emit typing stop', {
        socketId: socket.id,
        userId: socket.user.id,
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
};

module.exports = registerTypingHandlers;
