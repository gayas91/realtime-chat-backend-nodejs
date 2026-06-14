const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const groupIdParamSchema = Joi.object({
  params: Joi.object({
    groupId: objectId.required(),
  }).required(),
}).unknown(true);

const memberParamSchema = Joi.object({
  params: Joi.object({
    groupId: objectId.required(),
    userId: objectId.required(),
  }).required(),
}).unknown(true);

const createGroupSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    participantIds: Joi.array().items(objectId.required()).min(2).unique().required(),
  }).required(),
}).unknown(true);

const updateGroupSchema = Joi.object({
  params: Joi.object({
    groupId: objectId.required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
  }).required(),
}).unknown(true);

const addMembersSchema = Joi.object({
  params: Joi.object({
    groupId: objectId.required(),
  }).required(),
  body: Joi.object({
    memberIds: Joi.array().items(objectId.required()).min(1).unique().required(),
  }).required(),
}).unknown(true);

const addAdminSchema = Joi.object({
  params: Joi.object({
    groupId: objectId.required(),
  }).required(),
  body: Joi.object({
    userId: objectId.required(),
  }).required(),
}).unknown(true);

module.exports = {
  groupIdParamSchema,
  memberParamSchema,
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
  addAdminSchema,
};
