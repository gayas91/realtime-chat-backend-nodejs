const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
  .required()
  .messages({
    'string.pattern.base':
      'Password must include uppercase, lowercase, number, and special character',
  });

const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: passwordRule,
  }).required(),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required(),
  }).required(),
});

const refreshTokenSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }).required(),
});

const logoutSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
};
