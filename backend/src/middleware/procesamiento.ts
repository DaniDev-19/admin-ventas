import { Request, Response, NextFunction } from "express";

export const procesamientoMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Asegura que exista startTime
  req.startTime = req.startTime ?? new Date();
  const startMs = req.startTime.getTime();

  // Interceptamos la función end para inyectar header antes de que se cierre la respuesta
  const originalEnd = res.end.bind(res);
  (res as any).end = (...args: any[]) => {
    const duration = Date.now() - startMs;
    try {
      res.setHeader("X-Response-Time", `${duration}ms`);
    } catch (e) {
      // si falla al poner header, no bloqueamos la respuesta
    }
    // Registrar aquí es útil para logs centralizados
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration} ms)`);
    return originalEnd(...(args as [any?, any?, any?]));
  };

  next();
};