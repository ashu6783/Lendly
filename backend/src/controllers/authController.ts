import { Request, Response } from 'express';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { ApiError, asyncHandler } from '../utils/ApiError';
import { Role } from '../types';

function publicUser(user: { _id: unknown; name: string; email: string; role: Role }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/signup — public signups always create a Borrower account.
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    throw ApiError.badRequest('name, email and password are required');
  }
  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: Role.Borrower,
  });

  const token = signToken({ sub: String(user._id), role: user.role, email: user.email });
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    throw ApiError.badRequest('email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ sub: String(user._id), role: user.role, email: user.email });
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user: publicUser(user) });
});
