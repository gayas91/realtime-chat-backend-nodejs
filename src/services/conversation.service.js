const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const uniqueIds = (ids) => [...new Set(ids.map((id) => id.toString()))];

const ensureUsersExist = async (userIds) => {
  const uniqueUserIds = uniqueIds(userIds);
  const activeUsersCount = await User.countDocuments({
    _id: { $in: uniqueUserIds },
    isActive: true,
  });

  if (activeUsersCount !== uniqueUserIds.length) {
    throw new ApiError(400, 'One or more participants are invalid or inactive');
  }
};

const populateConversation = (query) =>
  query
    .populate('participants', 'name email role isActive')
    .populate('admins', 'name email role')
    .populate({
      path: 'lastMessage',
      select: 'content type status senderId createdAt',
      populate: {
        path: 'senderId',
        select: 'name email',
      },
    })
    .populate('createdBy', 'name email role');

const createDirectConversation = async (currentUserId, participantId) => {
  if (currentUserId === participantId) {
    throw new ApiError(400, 'Direct conversation requires two distinct participants');
  }

  await ensureUsersExist([currentUserId, participantId]);

  const participantObjectIds = [toObjectId(currentUserId), toObjectId(participantId)];
  const existingConversation = await populateConversation(
    Conversation.findOne({
      type: 'direct',
      isActive: true,
      participants: {
        $all: participantObjectIds,
        $size: 2,
      },
    })
  );

  if (existingConversation) {
    return existingConversation;
  }

  const conversation = await Conversation.create({
    type: 'direct',
    participants: participantObjectIds,
    admins: [],
    createdBy: currentUserId,
  });

  return populateConversation(Conversation.findById(conversation.id));
};

const createGroupConversation = async (currentUserId, { name, participantIds }) => {
  const allParticipantIds = uniqueIds([currentUserId, ...participantIds]);

  if (allParticipantIds.length < 3) {
    throw new ApiError(400, 'Group conversation requires at least 3 participants');
  }

  await ensureUsersExist(allParticipantIds);

  const conversation = await Conversation.create({
    type: 'group',
    name,
    participants: allParticipantIds.map(toObjectId),
    admins: [currentUserId],
    createdBy: currentUserId,
  });

  return populateConversation(Conversation.findById(conversation.id));
};

const getUserConversations = async (currentUserId) =>
  populateConversation(
    Conversation.find({
      participants: currentUserId,
      isActive: true,
    }).sort({ updatedAt: -1 })
  );

const getConversationById = async (conversationId, currentUserId) => {
  const conversation = await populateConversation(
    Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
      isActive: true,
    })
  );

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  return conversation;
};

const ensureParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
    isActive: true,
  });

  if (!conversation) {
    throw new ApiError(403, 'You are not a participant of this conversation');
  }

  return conversation;
};

module.exports = {
  createDirectConversation,
  createGroupConversation,
  getUserConversations,
  getConversationById,
  ensureParticipant,
};
