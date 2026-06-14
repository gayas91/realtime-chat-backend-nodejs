const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ApiError = require('../utils/ApiError');
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

const buildSearchPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

const searchMessagesByQuery = async ({ query, conversationIds, page, limit, currentUserId }) => {
  const skip = (page - 1) * limit;
  const filter = {
    $text: { $search: query },
    conversationId: { $in: conversationIds },
    type: 'text',
    isDeleted: false,
    deletedFor: { $ne: currentUserId },
  };

  const [messages, total] = await Promise.all([
    populateMessage(Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Message.countDocuments(filter),
  ]);

  return {
    messages,
    pagination: buildSearchPagination(page, limit, total),
  };
};

const searchUserMessages = async (currentUserId, { q, page, limit }) => {
  const conversations = await Conversation.find({
    participants: currentUserId,
    isActive: true,
  }).select('_id');
  const conversationIds = conversations.map((conversation) => conversation.id);

  if (!conversationIds.length) {
    return {
      messages: [],
      pagination: buildSearchPagination(page, limit, 0),
    };
  }

  return searchMessagesByQuery({
    query: q,
    conversationIds,
    page,
    limit,
    currentUserId,
  });
};

const searchConversationMessages = async (conversationId, currentUserId, { q, page, limit }) => {
  await conversationService.ensureParticipant(conversationId, currentUserId);

  return searchMessagesByQuery({
    query: q,
    conversationIds: [conversationId],
    page,
    limit,
    currentUserId,
  });
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

const ensureEditableMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.senderId.toString() !== userId) {
    throw new ApiError(403, 'Only the sender can modify this message');
  }

  if (message.isDeleted) {
    throw new ApiError(400, 'Message is already deleted');
  }

  return message;
};

const editMessage = async (messageId, userId, { content }) => {
  const message = await ensureEditableMessage(messageId, userId);

  if (message.type !== 'text') {
    throw new ApiError(400, 'Only text messages can be edited');
  }

  message.content = content;
  message.editedAt = new Date();
  await message.save();

  return populateMessage(Message.findById(message.id));
};

const deleteMessage = async (messageId, userId) => {
  const message = await ensureEditableMessage(messageId, userId);

  message.isDeleted = true;
  message.content = 'This message was deleted';
  await message.save();

  return populateMessage(Message.findById(message.id));
};

const hasEveryoneExceptSender = (participantIds, senderId, userIds) => {
  const trackedUserIds = new Set(userIds.map((userId) => userId.toString()));

  return participantIds
    .filter((participantId) => participantId !== senderId.toString())
    .every((participantId) => trackedUserIds.has(participantId));
};

const getMessageAndConversation = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  const conversation = await conversationService.ensureParticipant(message.conversationId, userId);

  return {
    message,
    conversation,
  };
};

const markMessageAsDelivered = async (messageId, userId) => {
  const { message, conversation } = await getMessageAndConversation(messageId, userId);

  if (message.senderId.toString() === userId) {
    throw new ApiError(400, 'Sender cannot mark own message as delivered');
  }

  if (!message.deliveredTo.some((deliveredUserId) => deliveredUserId.toString() === userId)) {
    message.deliveredTo.push(userId);
  }

  const participantIds = getParticipantIds(conversation);

  if (
    message.status !== 'read' &&
    hasEveryoneExceptSender(participantIds, message.senderId, message.deliveredTo)
  ) {
    message.status = 'delivered';
  }

  await message.save();

  return populateMessage(Message.findById(message.id));
};

const markMessageAsRead = async (messageId, userId) => {
  const { message, conversation } = await getMessageAndConversation(messageId, userId);

  if (message.senderId.toString() === userId) {
    throw new ApiError(400, 'Sender cannot mark own message as read');
  }

  if (!message.readBy.some((readUserId) => readUserId.toString() === userId)) {
    message.readBy.push(userId);
  }

  const participantIds = getParticipantIds(conversation);

  if (hasEveryoneExceptSender(participantIds, message.senderId, message.readBy)) {
    message.status = 'read';
  }

  await message.save();

  return populateMessage(Message.findById(message.id));
};

const markConversationAsRead = async (conversationId, userId) => {
  const conversation = await conversationService.ensureParticipant(conversationId, userId);
  const messages = await Message.find({
    conversationId,
    senderId: { $ne: userId },
    readBy: { $ne: userId },
    isDeleted: false,
  });
  const participantIds = getParticipantIds(conversation);

  await Promise.all(
    messages.map(async (message) => {
      message.readBy.push(userId);

      if (hasEveryoneExceptSender(participantIds, message.senderId, message.readBy)) {
        message.status = 'read';
      }

      await message.save();
    })
  );

  return {
    updatedCount: messages.length,
  };
};

const markDeliveredForUsers = async (messageId, userIds) => {
  if (!userIds.length) {
    return null;
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return null;
  }

  const conversation = await conversationService.ensureParticipant(
    message.conversationId,
    message.senderId.toString()
  );
  const deliveredUserIds = userIds.filter((userId) => userId !== message.senderId.toString());

  deliveredUserIds.forEach((userId) => {
    if (!message.deliveredTo.some((deliveredUserId) => deliveredUserId.toString() === userId)) {
      message.deliveredTo.push(userId);
    }
  });

  if (
    message.status !== 'read' &&
    hasEveryoneExceptSender(getParticipantIds(conversation), message.senderId, message.deliveredTo)
  ) {
    message.status = 'delivered';
  }

  await message.save();

  return message;
};

const getParticipantIds = (conversation) =>
  conversation.participants.map((participantId) => participantId.toString());

module.exports = {
  getConversationMessages,
  searchUserMessages,
  searchConversationMessages,
  createMessage,
  editMessage,
  deleteMessage,
  markMessageAsDelivered,
  markMessageAsRead,
  markConversationAsRead,
  markDeliveredForUsers,
  getParticipantIds,
};
