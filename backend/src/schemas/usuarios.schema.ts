import { z } from 'zod';

export const createUsuarioSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder los 50 caracteres')
    .trim(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z
    .string()
    .max(250, 'El nombre completo no puede exceder los 250 caracteres')
    .optional()
    .nullable(),
  rol: z
    .string()
    .min(1, 'El rol es obligatorio')
    .max(50)
    .default('admin'),
  status: z
    .string()
    .min(1)
    .max(50)
    .default('activo')
    .optional(),
});

export const updateUsuarioSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder los 50 caracteres')
    .trim()
    .optional(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  nombre: z
    .string()
    .max(250, 'El nombre completo no puede exceder los 250 caracteres')
    .optional()
    .nullable(),
  rol: z
    .string()
    .min(1)
    .max(50)
    .optional(),
  status: z
    .string()
    .min(1)
    .max(50)
    .optional(),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
