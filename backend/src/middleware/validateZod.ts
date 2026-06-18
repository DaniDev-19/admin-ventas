import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodIssue } from 'zod'

export const validateZod = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const message = result.error.issues.map((e: ZodIssue) => e.message).join(', ')
    return res.status(400).json({ status: 'error', message })
  }
  req.body = result.data
  next()
}

export default validateZod

