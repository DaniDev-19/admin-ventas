import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { enrichAndNext } from '../utils/nextError';
import { ConflictError, NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

export const getUsuariosAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma;
    if (!prisma) throw new Error('Client database not found in request');

    // Solo admin puede ver usuarios
    if (req.user?.rol !== 'admin') {
      throw new ForbiddenError('No tienes permisos para ver los usuarios');
    }

    const users = await prisma.usuarios.findMany({
      select: {
        id: true,
        username: true,
        nombre: true,
        rol: true,
        status: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const createUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma;
    if (!prisma) throw new Error('Client database not found in request');

    // Solo admin puede crear usuarios
    if (req.user?.rol !== 'admin') {
      throw new ForbiddenError('No tienes permisos para crear usuarios');
    }

    const { username, password, nombre, rol, status } = req.body;

    // Verificar si el usuario ya existe
    const existing = await prisma.usuarios.findUnique({
      where: { username },
    });

    if (existing) {
      throw new ConflictError('El nombre de usuario ya está registrado');
    }

    // Encriptar contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await prisma.usuarios.create({
      data: {
        username,
        password: hashedPassword,
        nombre,
        rol: rol || 'admin',
        status: status || 'activo',
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        rol: true,
        status: true,
        created_at: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Usuario creado exitosamente',
      data: newUser,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const updateUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma;
    if (!prisma) throw new Error('Client database not found in request');

    // Solo admin puede actualizar usuarios
    if (req.user?.rol !== 'admin') {
      throw new ForbiddenError('No tienes permisos para editar usuarios');
    }

    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      throw new ValidationError('ID de usuario inválido');
    }

    const { username, password, nombre, rol, status } = req.body;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Si intenta cambiar username, validar unicidad
    if (username && username !== existingUser.username) {
      const duplicate = await prisma.usuarios.findUnique({
        where: { username },
      });
      if (duplicate) {
        throw new ConflictError('El nombre de usuario ya está en uso');
      }
    }

    // Validar que un administrador no se inahbilite ni se quite el rol de administrador a sí mismo
    if (req.user?.id === userId) {
      if (status === 'inactivo') {
        throw new ForbiddenError('No puedes inhabilitar tu propia cuenta de usuario activa');
      }
      if (rol && rol !== 'admin') {
        throw new ForbiddenError('No puedes quitarte el rol de Administrador a ti mismo');
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (rol) updateData.rol = rol;
    if (status) updateData.status = status;

    // Si se envía contraseña, encriptarla
    if (password && password.trim() !== '') {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    const updatedUser = await prisma.usuarios.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nombre: true,
        rol: true,
        status: true,
        created_at: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Usuario actualizado exitosamente',
      data: updatedUser,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const deleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma;
    if (!prisma) throw new Error('Client database not found in request');

    // Solo admin puede eliminar usuarios
    if (req.user?.rol !== 'admin') {
      throw new ForbiddenError('No tienes permisos para eliminar usuarios');
    }

    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      throw new ValidationError('ID de usuario inválido');
    }

    // Impedir que un admin se elimine a sí mismo
    if (req.user?.id === userId) {
      throw new ForbiddenError('No puedes eliminar tu propia cuenta de usuario');
    }

    // Verificar si el usuario existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    await prisma.usuarios.delete({
      where: { id: userId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};
