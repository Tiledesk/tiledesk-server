const AppError = require('../utils/AppError');
const winston = require('../config/winston');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    winston.error(err.message, err);
    return res.status(err.status).json({
      success: false,
      message: err.message
    });
  }

  winston.debug("err.name", err.name);
  if (err.name === "IpDeniedError") {
    winston.debug("IpDeniedError");
    return res.status(401).json({ err: "error ip filter" });
  }

  const realIp = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || req.ip;

  // emitted by multer when the file is too big
  if (err.code === "LIMIT_FILE_SIZE") {
    winston.debug("LIMIT_FILE_SIZE");
    winston.warn(`LIMIT_FILE_SIZE on ${req.originalUrl}`, {
      limit: process.env.MAX_UPLOAD_FILE_SIZE,
      ip: req.ip,
      realIp: realIp
    });
    return res.status(413).json({ err: "Content Too Large", limit_file_size: process.env.MAX_UPLOAD_FILE_SIZE });
  }

  if (err.type === "entity.too.large" || err.name === "PayloadTooLargeError") {
    winston.warn("Payload too large", { expected: err.expected, limit: err.limit, length: err.length });
    return res.status(413).json({ err: "Request entity too large", limit: err.limit });
  }

  winston.error("General error: ", err);
  return res.status(500).json({ err: "error" });
}

module.exports = errorHandler;
