const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const conversationIdParamSchema = Joi.object({
  params: Joi.object({
    conversationId: objectId.required(),
  }).required(),
}).unknown(true);

const createMessageSchema = Joi.object({
  params: Joi.object({
    conversationId: objectId.required(),
  }).required(),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(5000).required(),
    type: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
  }).required(),
}).unknown(true);

module.exports = {
  conversationIdParamSchema,
  createMessageSchema,
};
