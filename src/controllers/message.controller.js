const messageService = require('../services/message.service');
const asyncHandler = require('../utils/asyncHandler');

const getMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.getConversationMessages(
    req.params.conversationId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: {
      messages,
    },
  });
});

const createMessage = asyncHandler(async (req, res) => {
  const message = await messageService.createMessage(req.params.conversationId, req.user.id, {
    content: req.body.content,
    type: req.body.type,
  });

  res.status(201).json({
    success: true,
    data: {
      message,
    },
  });
});

const editMessage = asyncHandler(async (req, res) => {
  const message = await messageService.editMessage(req.params.messageId, req.user.id, {
    content: req.body.content,
  });

  res.status(200).json({
    success: true,
    data: {
      message,
    },
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const message = await messageService.deleteMessage(req.params.messageId, req.user.id);

  res.status(200).json({
    success: true,
    data: {
      message,
    },
  });
});

const markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await messageService.markMessageAsRead(req.params.messageId, req.user.id);

  res.status(200).json({
    success: true,
    data: {
      message,
    },
  });
});

const markConversationAsRead = asyncHandler(async (req, res) => {
  const result = await messageService.markConversationAsRead(
    req.params.conversationId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  getMessages,
  createMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markConversationAsRead,
};
