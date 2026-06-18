import { NextFunction } from "express";
import { AppError } from "./errors";

export const enrichAndNext = (err: unknown, next: NextFunction) => {
    if (err && typeof err === "object") {
        if (err instanceof AppError || (err as any).status !== undefined) {
            return next(err);
        }

        // Mapeo automático de códigos comunes de error de Prisma
        const code = (err as any).code;
        if (code === 'P2025') {
            (err as any).status = 404;
            (err as any).message = 'El registro solicitado no existe';
        } else if (code === 'P2002') {
            (err as any).status = 409;
            (err as any).message = 'Conflicto: Ya existe un registro con uno de los valores ingresados';
        } else if (code === 'P2003') {
            (err as any).status = 409;
            (err as any).message = 'Restricción de clave foránea: No se puede eliminar el registro debido a dependencias activas';
        } else {
            const name = (err as any).name;
            if (name === "ValidationError") {
                (err as any).status = 400;
            } else if (name === "NotFoundError") {
                (err as any).status = 404;
            } else if (name === "ConflictError") {
                (err as any).status = 409;
            } else if (name === "DatabaseError") {
                (err as any).status = 500;
            } else if (name === "UnauthorizedError") {
                (err as any).status = 401;
            } else if (name === "ForbiddenError") {
                (err as any).status = 403;
            }
        }
        next(err);
    } else {
        next(err);
    }
};


