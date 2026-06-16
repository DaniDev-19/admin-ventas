import { NextFunction } from "express";

export const enrichAndNext = (err: unknown, next: NextFunction) => {
    if (err && typeof err === "object") {
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
        next(err);
    }
};

