import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';
import { enrichAndNext } from '../utils/nextError';

const JWT_SECRET = process.env.JWT_SECRET || 'single_sale_secret_key';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticación requerido');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        username: string;
        rol: string;
      };

      req.user = decoded;
      next();
    } catch (err) {
      throw new UnauthorizedError('Token de autenticación inválido o expirado');
    }
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export default authMiddleware;
