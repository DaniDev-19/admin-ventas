import { Request, Response, NextFunction } from "express";

export const procesamientoMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Asegura que exista startTime
  req.startTime = req.startTime ?? new Date();
  const startMs = req.startTime.getTime();

  // Escuchamos el evento 'finish' para registrar el log después de enviar la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startMs;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration} ms)`);
  });

  next();
};