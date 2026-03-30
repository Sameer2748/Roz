function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File size exceeds 5MB limit',
      code: 'FILE_TOO_LARGE',
    });
  }

  if (err.message && err.message.includes('Only JPEG')) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'INVALID_FILE_TYPE',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
}

module.exports = errorHandler;
