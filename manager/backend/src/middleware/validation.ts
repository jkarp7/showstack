import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'
import { createError } from './errorHandler.js'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw createError(message, 400)
      }
      next(error)
    }
  }
}
