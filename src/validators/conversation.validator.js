const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createDirectConversationSchema = Joi.object({
  body: Joi.object({
    participantId: objectId.required(),
  }).required(),
}).unknown(true);

const createGroupConversationSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    participantIds: Joi.array().items(objectId.required()).min(2).unique().required(),
  }).required(),
}).unknown(true);

const conversationIdParamSchema = Joi.object({
  params: Joi.object({
    conversationId: objectId.required(),
  }).required(),
}).unknown(true);

module.exports = {
  createDirectConversationSchema,
  createGroupConversationSchema,
  conversationIdParamSchema,
};
