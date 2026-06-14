const conversationService = require('../services/conversation.service');
const asyncHandler = require('../utils/asyncHandler');

const createDirectConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.createDirectConversation(
    req.user.id,
    req.body.participantId
  );

  res.status(201).json({
    success: true,
    data: {
      conversation,
    },
  });
});

const createGroupConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.createGroupConversation(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: {
      conversation,
    },
  });
});

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await conversationService.getUserConversations(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      conversations,
    },
  });
});

const getConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.getConversationById(
    req.params.conversationId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: {
      conversation,
    },
  });
});

module.exports = {
  createDirectConversation,
  createGroupConversation,
  getConversations,
  getConversation,
};
