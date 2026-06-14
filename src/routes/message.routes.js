const express = require('express');

const messageController = require('../controllers/message.controller');
const { uploadSingleFile } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const messageValidator = require('../validators/message.validator');

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  validate(messageValidator.conversationIdParamSchema),
  messageController.getMessages
);
router.post('/', validate(messageValidator.createMessageSchema), messageController.createMessage);
router.post(
  '/file',
  uploadSingleFile,
  validate(messageValidator.createFileMessageSchema),
  messageController.createFileMessage
);

module.exports = router;
