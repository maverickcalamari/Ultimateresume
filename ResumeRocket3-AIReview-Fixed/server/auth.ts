import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, type User } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  user?: User;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      try {
        const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Continue without user
      }
    }
  }
  next();
}