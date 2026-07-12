const Logger = require('../utils/Logger');
const logger = new Logger();

// Central error responder. Operational errors (utils/ErrorResponse with an
// explicit statusCode) pass their message through. Multer and Sequelize
// validation failures map to 400 with their (safe, field-level) messages.
// Everything else is logged in full server-side and returned as a generic
// 500 in production so internals never leak to clients.
const errorHandler = (err, req, res, next) => {
  const message = err.message || 'Server Error';

  logger.log(String(message).split(',')[0], 'ERROR');

  if (process.env.NODE_ENV == 'development') {
    console.log(err);
  }

  if (typeof err.statusCode === 'number') {
    return res.status(err.statusCode).json({
      success: false,
      error: message,
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: message,
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: err.errors.map((e) => e.message).join(', '),
    });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Server Error' : message,
  });
};

module.exports = errorHandler;
