const express = require('express');
const messageController = require('../controllers/message.controller');
const authRoutes = require('./auth.routes');
const conversationRoutes = require('./conversation.routes');
const healthRoutes = require('./health.routes');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const messageValidator = require('../validators/message.validator');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.patch(
  '/messages/:messageId',
  authenticate,
  validate(messageValidator.updateMessageSchema),
  messageController.editMessage
);
router.delete(
  '/messages/:messageId',
  authenticate,
  validate(messageValidator.messageIdParamSchema),
  messageController.deleteMessage
);
router.post(
  '/messages/:messageId/read',
  authenticate,
  validate(messageValidator.messageIdParamSchema),
  messageController.markMessageAsRead
);
router.use(healthRoutes);

module.exports = router;
