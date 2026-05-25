import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound('Route not found'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known API errors
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  // Multer upload errors (e.g. file too large)
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File is too large. Maximum size is ${env.maxFileSizeMb} MB.`
        : err.message;
    res.status(400).json({ message });
    return;
  }

  // Mongo duplicate key (e.g. unique email / UTR)
  const anyErr = err as { code?: number; keyValue?: Record<string, unknown>; message?: string };
  if (anyErr?.code === 11000) {
    const field = anyErr.keyValue ? Object.keys(anyErr.keyValue)[0] : 'field';
    res.status(409).json({ message: `Duplicate value for ${field}.` });
    return;
  }

  // Multer fileFilter rejections come through as plain Errors
  if (anyErr?.message && /Only PDF, JPG, and PNG/.test(anyErr.message)) {
    res.status(400).json({ message: anyErr.message });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(env.nodeEnv === 'development' ? { error: anyErr?.message } : {}),
  });
}
