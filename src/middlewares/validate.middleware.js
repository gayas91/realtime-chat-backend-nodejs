const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(
    {
      body: req.body,
      query: req.query,
      params: req.params,
    },
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return next(new ApiError(400, 'Request validation failed', true, details));
  }

  req.body = value.body || req.body;
  req.query = value.query || req.query;
  req.params = value.params || req.params;

  return next();
};

module.exports = validate;
