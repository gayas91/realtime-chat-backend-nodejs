const express = require('express');

const messageController = require('../controllers/message.controller');
const validate = require('../middlewares/validate.middleware');
const messageValidator = require('../validators/message.validator');

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  validate(messageValidator.conversationIdParamSchema),
  messageController.getMessages
);
router.post('/', validate(messageValidator.createMessageSchema), messageController.createMessage);

module.exports = router;
