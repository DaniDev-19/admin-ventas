import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export const checkRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.rol)) {
      return next(new ForbiddenError('No tienes permisos suficientes para realizar esta acción'));
    }
    next();
  };
};

export default checkRoles;
