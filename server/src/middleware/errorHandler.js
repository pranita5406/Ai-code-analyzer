/**
 * @fileoverview Global Error Handler for Express Server
 */

export default function errorHandler(err, req, res, next) {
  console.error('[Error Handler] Caught Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
