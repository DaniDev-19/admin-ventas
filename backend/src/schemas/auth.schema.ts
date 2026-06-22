import { z } from 'zod';

export const registerSchema = z.object({
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
    .optional(),
  rol: z
    .string()
    .default('vendedor')
    .optional(),
});

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'El nombre de usuario es obligatorio')
    .trim(),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
