import { Request, Response, NextFunction } from 'express';

export const ValidateSchema = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction ) => {
        const { error } = schema.validate(req.body, { abortEarly: false});
        if (error) {
            return res.status(400).json({ status: "error", message: error.details.map((d: any) => d.message).join(", ") });
        }
        next();
    }
}