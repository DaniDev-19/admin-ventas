import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

/**
 * Middleware que adjunta la instancia de Prisma al `req` como `req.prisma`.
 * También asegura que la conexión se establezca una sola vez en el lifecycle del proceso.
 */
const dbMiddleware = async (
    req: Request & { prisma?: typeof prisma },
    _res: Response,
    next: NextFunction
) => {
    try {
        
        req.prisma = prisma;

        if (!(globalThis as any).__prismaConnected) {
            await prisma.$connect();
            (globalThis as any).__prismaConnected = true;
        }

        return next();
    } catch (err) {
        return next(err);
    }
};

export default dbMiddleware;