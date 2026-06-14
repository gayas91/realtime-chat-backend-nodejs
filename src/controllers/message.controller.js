const messageService = require('../services/message.service');
const uploadService = require('../services/upload.service');
const socketEvents = require('../constants/socketEvents');
const asyncHandler = require('../utils/asyncHandler');
const { emitToConversationRoom } = require('../sockets/conversation.socket');

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

const createFileMessage = asyncHandler(async (req, res) => {
  const file = uploadService.getFileMetadata(req.file);
  const message = await messageService.createMessage(req.params.conversationId, req.user.id, {
    content: req.body.content || file.originalName,
    type: uploadService.getMessageTypeFromMimeType(file.mimeType),
    attachments: [file],
  });

  emitToConversationRoom(req.params.conversationId, socketEvents.MESSAGE_NEW, {
    conversationId: req.params.conversationId,
    message,
  });

  res.status(201).json({
    success: true,
    data: {
      message,
    },
  });
});

const searchMessages = asyncHandler(async (req, res) => {
  const result = await messageService.searchUserMessages(req.user.id, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const searchConversationMessages = asyncHandler(async (req, res) => {
  const result = await messageService.searchConversationMessages(
    req.params.conversationId,
    req.user.id,
    req.query
  );

  res.status(200).json({
    success: true,
    data: result,
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
  createFileMessage,
  searchMessages,
  searchConversationMessages,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markConversationAsRead,
};
