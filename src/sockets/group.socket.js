const logger = require('../utils/logger');
const { getConversationRoom } = require('./conversation.socket');

let socketServer = null;

const registerGroupSocketServer = (io) => {
  socketServer = io;
};

const emitGroupEvent = (groupId, eventName, payload) => {
  if (!socketServer) {
    logger.warn('Socket.IO server is not initialized for group event', {
      groupId,
      eventName,
    });
    return;
  }

  socketServer.to(getConversationRoom(groupId)).emit(eventName, payload);
};

module.exports = {
  registerGroupSocketServer,
  emitGroupEvent,
};
