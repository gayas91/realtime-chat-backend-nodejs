const express = require('express');

const conversationController = require('../controllers/conversation.controller');
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const conversationValidator = require('../validators/conversation.validator');
const messageValidator = require('../validators/message.validator');
const messageRoutes = require('./message.routes');

const router = express.Router();

router.use(authenticate);

router.post(
  '/direct',
  validate(conversationValidator.createDirectConversationSchema),
  conversationController.createDirectConversation
);
router.post(
  '/group',
  validate(conversationValidator.createGroupConversationSchema),
  conversationController.createGroupConversation
);
router.get('/', conversationController.getConversations);
router.get(
  '/:conversationId',
  validate(conversationValidator.conversationIdParamSchema),
  conversationController.getConversation
);
router.post(
  '/:conversationId/read',
  validate(conversationValidator.conversationIdParamSchema),
  messageController.markConversationAsRead
);
router.get(
  '/:conversationId/messages/search',
  validate(messageValidator.searchConversationMessagesSchema),
  messageController.searchConversationMessages
);
router.use('/:conversationId/messages', messageRoutes);

module.exports = router;
