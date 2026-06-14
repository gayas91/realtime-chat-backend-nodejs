const socketEvents = require('../constants/socketEvents');
const groupService = require('../services/group.service');
const asyncHandler = require('../utils/asyncHandler');
const { emitGroupEvent } = require('../sockets/group.socket');

const sendGroupResponse = (res, statusCode, group) => {
  res.status(statusCode).json({
    success: true,
    data: {
      group,
    },
  });
};

const createGroup = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.user.id, req.body);

  emitGroupEvent(group.id, socketEvents.GROUP_UPDATED, { group });
  sendGroupResponse(res, 201, group);
});

const updateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.updateGroup(req.params.groupId, req.user.id, req.body);

  emitGroupEvent(group.id, socketEvents.GROUP_UPDATED, { group });
  sendGroupResponse(res, 200, group);
});

const addMembers = asyncHandler(async (req, res) => {
  const group = await groupService.addMembers(req.params.groupId, req.user.id, req.body.memberIds);

  emitGroupEvent(group.id, socketEvents.GROUP_MEMBER_ADDED, {
    group,
    memberIds: req.body.memberIds,
  });
  sendGroupResponse(res, 200, group);
});

const removeMember = asyncHandler(async (req, res) => {
  const group = await groupService.removeMember(req.params.groupId, req.user.id, req.params.userId);

  emitGroupEvent(group.id, socketEvents.GROUP_MEMBER_REMOVED, {
    group,
    userId: req.params.userId,
  });
  sendGroupResponse(res, 200, group);
});

const addAdmin = asyncHandler(async (req, res) => {
  const group = await groupService.addAdmin(req.params.groupId, req.user.id, req.body.userId);

  emitGroupEvent(group.id, socketEvents.GROUP_ADMIN_ADDED, {
    group,
    userId: req.body.userId,
  });
  sendGroupResponse(res, 200, group);
});

const removeAdmin = asyncHandler(async (req, res) => {
  const group = await groupService.removeAdmin(req.params.groupId, req.user.id, req.params.userId);

  emitGroupEvent(group.id, socketEvents.GROUP_ADMIN_REMOVED, {
    group,
    userId: req.params.userId,
  });
  sendGroupResponse(res, 200, group);
});

const leaveGroup = asyncHandler(async (req, res) => {
  const group = await groupService.leaveGroup(req.params.groupId, req.user.id);

  emitGroupEvent(req.params.groupId, socketEvents.GROUP_LEFT, {
    group,
    userId: req.user.id,
  });
  sendGroupResponse(res, 200, group);
});

module.exports = {
  createGroup,
  updateGroup,
  addMembers,
  removeMember,
  addAdmin,
  removeAdmin,
  leaveGroup,
};
