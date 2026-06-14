const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const ApiError = require('../utils/ApiError');
const { ensureUsersExist, populateConversation } = require('./conversation.service');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);
const toStringId = (id) => id.toString();
const uniqueIds = (ids) => [...new Set(ids.map(toStringId))];

const includesId = (ids, id) => ids.some((existingId) => toStringId(existingId) === toStringId(id));

const getGroupById = async (groupId) => {
  const group = await Conversation.findOne({
    _id: groupId,
    type: 'group',
    isActive: true,
  });

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  return group;
};

const getPopulatedGroup = (groupId) => populateConversation(Conversation.findById(groupId));

const ensureAdmin = (group, userId) => {
  if (!includesId(group.admins, userId)) {
    throw new ApiError(403, 'Only group admins can perform this action');
  }
};

const ensureParticipant = (group, userId) => {
  if (!includesId(group.participants, userId)) {
    throw new ApiError(403, 'User is not a group participant');
  }
};

const createGroup = async (currentUserId, { name, participantIds }) => {
  const allParticipantIds = uniqueIds([currentUserId, ...participantIds]);

  if (allParticipantIds.length < 3) {
    throw new ApiError(400, 'Group requires at least 3 participants including creator');
  }

  await ensureUsersExist(allParticipantIds);

  const group = await Conversation.create({
    type: 'group',
    name,
    participants: allParticipantIds.map(toObjectId),
    admins: [currentUserId],
    createdBy: currentUserId,
  });

  return getPopulatedGroup(group.id);
};

const updateGroup = async (groupId, currentUserId, { name }) => {
  const group = await getGroupById(groupId);

  ensureAdmin(group, currentUserId);

  group.name = name;
  await group.save();

  return getPopulatedGroup(group.id);
};

const addMembers = async (groupId, currentUserId, memberIds) => {
  const group = await getGroupById(groupId);

  ensureAdmin(group, currentUserId);
  await ensureUsersExist(memberIds);

  memberIds.forEach((memberId) => {
    if (!includesId(group.participants, memberId)) {
      group.participants.push(memberId);
    }
  });

  await group.save();

  return getPopulatedGroup(group.id);
};

const removeMember = async (groupId, currentUserId, userId) => {
  const group = await getGroupById(groupId);

  ensureAdmin(group, currentUserId);
  ensureParticipant(group, userId);

  if (toStringId(group.createdBy) === userId) {
    throw new ApiError(400, 'Group creator cannot be removed');
  }

  group.participants = group.participants.filter(
    (participantId) => toStringId(participantId) !== userId
  );
  group.admins = group.admins.filter((adminId) => toStringId(adminId) !== userId);
  await group.save();

  return getPopulatedGroup(group.id);
};

const addAdmin = async (groupId, currentUserId, userId) => {
  const group = await getGroupById(groupId);

  ensureAdmin(group, currentUserId);
  ensureParticipant(group, userId);

  if (includesId(group.admins, userId)) {
    throw new ApiError(400, 'User is already a group admin');
  }

  group.admins.push(userId);
  await group.save();

  return getPopulatedGroup(group.id);
};

const removeAdmin = async (groupId, currentUserId, userId) => {
  const group = await getGroupById(groupId);

  ensureAdmin(group, currentUserId);

  if (!includesId(group.admins, userId)) {
    throw new ApiError(400, 'User is not a group admin');
  }

  if (toStringId(group.createdBy) === userId) {
    throw new ApiError(400, 'Group creator cannot be removed from admins');
  }

  if (group.admins.length <= 1) {
    throw new ApiError(400, 'Group must have at least one admin');
  }

  group.admins = group.admins.filter((adminId) => toStringId(adminId) !== userId);
  await group.save();

  return getPopulatedGroup(group.id);
};

const leaveGroup = async (groupId, currentUserId) => {
  const group = await getGroupById(groupId);

  ensureParticipant(group, currentUserId);

  const otherAdmins = group.admins.filter((adminId) => toStringId(adminId) !== currentUserId);

  if (toStringId(group.createdBy) === currentUserId && otherAdmins.length === 0) {
    throw new ApiError(400, 'Creator cannot leave while no other admin exists');
  }

  group.participants = group.participants.filter(
    (participantId) => toStringId(participantId) !== currentUserId
  );
  group.admins = group.admins.filter((adminId) => toStringId(adminId) !== currentUserId);
  await group.save();

  return getPopulatedGroup(group.id);
};

module.exports = {
  createGroup,
  updateGroup,
  addMembers,
  removeMember,
  addAdmin,
  removeAdmin,
  leaveGroup,
};
