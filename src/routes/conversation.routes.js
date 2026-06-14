const express = require('express');

const conversationController = require('../controllers/conversation.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const conversationValidator = require('../validators/conversation.validator');
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
router.use('/:conversationId/messages', messageRoutes);

module.exports = router;
