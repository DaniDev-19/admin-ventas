import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

/**
 * Middleware que adjunta la instancia singleton de Prisma al `req` como `req.prisma`.
 */
const dbMiddleware = (
    req: Request & { prisma?: typeof prisma },
    _res: Response,
    next: NextFunction
) => {
    req.prisma = prisma;
    next();
};

export default dbMiddleware;