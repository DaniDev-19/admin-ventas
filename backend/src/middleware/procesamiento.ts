import { Request, Response, NextFunction } from 'express';

export const procesamientoMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    const date = new Date();
    const start = req.startTime ?? date;
    const time = date.getTime() - start.getTime();
    console.log(`Request a ${req.path} procesado en ${time} ms`);
    next();
}