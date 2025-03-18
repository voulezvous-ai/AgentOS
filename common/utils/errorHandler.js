export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  });
}

export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Recurso não encontrado'
  });
}