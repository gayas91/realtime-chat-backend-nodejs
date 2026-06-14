const Message = require('../models/Message');
const conversationService = require('./conversation.service');

const populateMessage = (query) =>
  query
    .populate('senderId', 'name email role')
    .populate('deliveredTo', 'name email')
    .populate('readBy', 'name email');

const getConversationMessages = async (conversationId, currentUserId) => {
  await conversationService.ensureParticipant(conversationId, currentUserId);

  return populateMessage(
    Message.find({
      conversationId,
      deletedFor: { $ne: currentUserId },
    }).sort({ createdAt: 1 })
  );
};

const createMessage = async (conversationId, senderId, { content, type = 'text' }) => {
  const conversation = await conversationService.ensureParticipant(conversationId, senderId);

  const message = await Message.create({
    conversationId,
    senderId,
    content,
    type,
  });

  conversation.lastMessage = message.id;
  await conversation.save();

  return populateMessage(Message.findById(message.id));
};

const markDeliveredForUsers = async (messageId, userIds) => {
  if (!userIds.length) {
    return null;
  }

  const message = await Message.findByIdAndUpdate(
    messageId,
    {
      $addToSet: {
        deliveredTo: { $each: userIds },
      },
      $set: {
        status: 'delivered',
      },
    },
    {
      new: true,
    }
  );

  return message;
};

const getParticipantIds = (conversation) =>
  conversation.participants.map((participantId) => participantId.toString());

module.exports = {
  getConversationMessages,
  createMessage,
  markDeliveredForUsers,
  getParticipantIds,
};
