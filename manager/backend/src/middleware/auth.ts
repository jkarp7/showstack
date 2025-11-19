import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { createError } from './errorHandler.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    subscriptionTier: string
  }
}

export function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError('No authorization token provided', 401)
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = {
      id: decoded.id,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier,
    }
    next()
  } catch (error) {
    throw createError('Invalid or expired token', 401)
  }
}
