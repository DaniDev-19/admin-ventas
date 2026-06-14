import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
    res.status(404).json({
        status: 'error',
        message: 'Solicitud no encontrada o inexistente',
    });
};

export const unauthorizedHandler = (req: Request, res: Response, _next: NextFunction) => {
    res.status(403).json({
        status: 'error',
        message: 'Acceso no autorizado a esta ruta',
    });
};

export const globalErrorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('Error en el middleware de errores globales:', err);

    const status = (err as any)?.status || 500;
    const message = (err as any)?.message || 'Ocurrió un error inesperado en el servidor';

    res.status(status).json({
        status: 'error',
        message,
    });
};

export default { notFoundHandler, unauthorizedHandler, globalErrorHandler };