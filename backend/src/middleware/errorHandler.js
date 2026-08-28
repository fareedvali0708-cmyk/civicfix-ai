/**
 * Centralized error handling middleware.
 * Must be registered AFTER all routes in server.js.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error for debugging (replace with a logger in production)
  console.error(`[errorHandler] ${req.method} ${req.path} → ${status}: ${message}`);
  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 handler — must be registered AFTER all routes but BEFORE errorHandler.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
}
