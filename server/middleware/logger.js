const crypto = require('crypto');

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  const requestId = req.get('x-request-id') || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    logInfo('http_request', {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id || null,
    });
  });

  next();
}

function logInfo(message, context = {}) {
  writeLog('info', message, context);
}

function logError(message, err, context = {}) {
  writeLog('error', message, {
    ...context,
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

function writeLog(level, message, context) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'scout-report-api',
    ...removeUndefined(context),
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined));
}

module.exports = {
  logError,
  logInfo,
  requestLogger,
};
