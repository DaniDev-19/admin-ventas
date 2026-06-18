import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.services';
import { enrichAndNext } from '../utils/nextError';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma;
    if (!prisma) throw new Error('Client database not found in request');

    const authService = new AuthService(prisma);
    const user = await authService.register(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Usuario registrado exitosamente',
      data: user
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma;
    if (!prisma) throw new Error('Client database not found in request');

    const authService = new AuthService(prisma);
    const result = await authService.login(req.body);

    res.status(200).json({
      status: 'success',
      message: 'Inicio de sesión exitoso',
      data: result
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};
