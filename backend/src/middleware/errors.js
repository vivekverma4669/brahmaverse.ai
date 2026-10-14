import { ApiError } from '../utils/ApiError.js';

export function notFound(_req, _res, next) {
  next(new ApiError(404, 'Route not found.'));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = 500;
  let message = 'Internal server error.';
  let errors;
  if (error instanceof ApiError) {
    status = error.status;
    message = error.message;
    errors = error.errors;
  } else if (error.code === 11000) {
    status = 409;
    message = 'An employee with this email already exists.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON request body.';
  } else if (error.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  } else if (error.name === 'ValidationError' || error.name === 'CastError') {
    status = 400;
    message = 'Invalid request data.';
  }
  if (status >= 500 && process.env.NODE_ENV !== 'test')
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: req.requestId,
        errorType: error.name || 'Error',
        message: 'Unexpected server error.',
      }),
    );
  res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    requestId: req.requestId,
  });
}
