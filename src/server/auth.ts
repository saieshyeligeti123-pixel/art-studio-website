import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';

/**
 * Retrieves the JWT secret key.
 * In production mode, strictly requires process.env.JWT_SECRET (min 32 chars) and throws on missing/weak keys.
 * In development/test mode, falls back to a development key if unspecified.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim().length < 32) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: JWT_SECRET environment variable is required and must be at least 32 characters long in production mode.'
      );
    }
    return secret.trim();
  }

  // Development/testing fallback
  return secret?.trim() || 'artstudio-dev-only-secret-do-not-use-in-production-32chars';
}

/**
 * Validates auth configuration on server startup.
 */
export function validateAuthConfig(): void {
  getJwtSecret();
}

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'studio';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Signs a JWT token valid for 7 days
 */
export function generateToken(user: AuthUserPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === 'studio' ? 'admin' : user.role,
    },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Extracts and verifies JWT from Authorization header
 */
export function verifyToken(token: string): AuthUserPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware: requires an authenticated user (HTTP 401 if missing/invalid)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please provide a valid Bearer token.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Invalid or expired session token. Please sign in again.',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  // Verify that user exists in SQLite database
  const userRow = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.id) as any;
  if (!userRow) {
    res.status(401).json({
      error: 'User account not found in database.',
      code: 'USER_NOT_FOUND',
    });
    return;
  }

  req.user = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role === 'studio' ? 'admin' : userRow.role,
  };

  next();
}

/**
 * Express middleware: requires admin/studio privileges (HTTP 403 if unauthorized)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  if (req.user.role !== 'admin' && (req.user.role as any) !== 'studio') {
    res.status(403).json({
      error: 'Access denied: Studio Administrator or Curator privileges are required.',
      code: 'FORBIDDEN',
    });
    return;
  }

  next();
}
