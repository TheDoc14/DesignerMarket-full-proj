//back-end/middleware/requestId.middleware.js
// Middleware to assign a unique request ID to each incoming request.
const crypto = require('crypto');

// This middleware checks for an existing 'X-Request-Id' header in the incoming request. If it exists and is a non-empty string, it uses that value as the request ID. Otherwise, it generates a new UUID using the crypto module. The request ID is then attached to the request object (req.requestId) for use in subsequent middleware and route handlers, and also set in the response headers (X-Request-Id) for client reference. 
function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];

  const requestId =
    (typeof incoming === 'string' && incoming.trim().length > 0)
      ? incoming.trim()
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  return next();
}

module.exports = { requestIdMiddleware };
