import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { Role } from '../types';

// Augment Express's Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email: string;
      };
    }
  }
}

/**
 * Verifies the Bearer token and attaches req.user.
 * Returns 401 if the token is missing or invalid.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/**
 * Like authenticate, but also accepts the token via a `?token=` query param.
 * Used only for file links opened in a new browser tab, where setting an
 * Authorization header is not possible.
 */
export function authenticateFlexible(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : queryToken;

  if (!token) {
    return next(ApiError.unauthorized('Missing token'));
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/**
 * RBAC guard. Admin is always allowed. Otherwise the user's role must be in the
 * allow-list. Returns 403 for an authenticated user with the wrong role.
 *
 * Access control is enforced on the BACKEND here (not just by hiding menu
 * items on the client) so direct API calls cannot bypass it.
 */
export function authorize(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (req.user.role === Role.Admin || allowed.includes(req.user.role)) {
      return next();
    }
    next(ApiError.forbidden());
  };
}
