/**
 * Centralized Error & 404 Middleware
 * Follows Express.js official guide on error handling and Express 5 async error forwarding.
 */

// Custom 404 handler for undefined API routes
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}

// Centralized error handler with 4 parameters (err, req, res, next)
export function errorHandler(err, req, res, next) {
  // If headers have already been sent to client, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = 413;
      message = "File size exceeds the 25MB limit.";
    } else {
      statusCode = 400;
      message = `Upload error: ${err.message}`;
    }
  }

  // Handle custom upload filter errors
  if (message.includes("Only image and video uploads are allowed")) {
    statusCode = 400;
  }

  // Handle Mongoose invalid ObjectId error
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Handle JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON payload in request body.";
  }

  // Log error details on server side
  if (statusCode >= 500) {
    console.error(`💥 [Server Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`⚠️  [Client Error] ${statusCode} ${req.method} ${req.originalUrl}: ${message}`);
  }

  const response = {
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}
