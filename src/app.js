const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const config = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

app.use(config.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
