const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(5000),
  APP_NAME: Joi.string().default('realtime-chat-backend-nodejs'),
  API_PREFIX: Joi.string().default('/api/v1'),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().default('*'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  isProduction: envVars.NODE_ENV === 'production',
  port: envVars.PORT,
  appName: envVars.APP_NAME,
  apiPrefix: envVars.API_PREFIX,
  corsOrigin: envVars.CORS_ORIGIN,
  logLevel: envVars.LOG_LEVEL,
  mongo: {
    uri: envVars.MONGODB_URI,
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiresIn: envVars.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },
};
