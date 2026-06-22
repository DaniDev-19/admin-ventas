import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodIssue } from 'zod'
import { ValidationError } from '../utils/errors'

export const validateZod = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const message = result.error.issues.map((e: ZodIssue) => e.message).join(', ')
    return next(new ValidationError(message))
  }
  req.body = result.data
  next()
}

export default validateZod

