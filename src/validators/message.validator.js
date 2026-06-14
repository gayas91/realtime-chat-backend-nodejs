const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const conversationIdParamSchema = Joi.object({
  params: Joi.object({
    conversationId: objectId.required(),
  }).required(),
}).unknown(true);

const messageIdParamSchema = Joi.object({
  params: Joi.object({
    messageId: objectId.required(),
  }).required(),
}).unknown(true);

const createMessageSchema = Joi.object({
  params: Joi.object({
    conversationId: objectId.required(),
  }).required(),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(5000).required(),
    type: Joi.string().valid('text', 'image', 'file', 'audio', 'system').default('text'),
  }).required(),
}).unknown(true);

const createFileMessageSchema = Joi.object({
  params: Joi.object({
    conversationId: objectId.required(),
  }).required(),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(5000).optional(),
  }).required(),
}).unknown(true);

const updateMessageSchema = Joi.object({
  params: Joi.object({
    messageId: objectId.required(),
  }).required(),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(5000).required(),
  }).required(),
}).unknown(true);

const searchMessagesSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().trim().min(1).max(120).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }).required(),
}).unknown(true);

const searchConversationMessagesSchema = Joi.object({
  params: Joi.object({
    conversationId: objectId.required(),
  }).required(),
  query: Joi.object({
    q: Joi.string().trim().min(1).max(120).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }).required(),
}).unknown(true);

module.exports = {
  conversationIdParamSchema,
  messageIdParamSchema,
  createMessageSchema,
  createFileMessageSchema,
  updateMessageSchema,
  searchMessagesSchema,
  searchConversationMessagesSchema,
};
