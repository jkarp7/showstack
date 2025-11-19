import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'
import { createError } from './errorHandler.js'

export function requireEdition(...allowedEditions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user) {
      throw createError('Unauthorized', 401)
    }

    if (!allowedEditions.includes(user.subscriptionTier)) {
      throw createError(
        `Feature not available. Required edition: ${allowedEditions.join(' or ')}`,
        403
      )
    }

    next()
  }
}
