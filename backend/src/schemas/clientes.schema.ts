import { z } from "zod";

export const clientesSchema = z.object({
    cedula: z.string({
        error: "La cédula debe ser una cadena de texto valida"
    }).nonempty("La cédula es obligatoria").min(7, "La cédula debe tener al menos 7 caracteres validos").max(9, "La cédula no puede tener mas de 9 caracteres"),
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(50, "El nombre no puede tener mas de 50 caracteres"),
    telefono: z.string().min(7, "El telefono debe tener al menos 7 caracteres validos").max(15, "El telefono no puede tener mas de 15 caracteres").optional(),
    status: z.string().optional()
});

export const updateClientesSchema = z.object({
    cedula: z.string().min(7, "La cédula debe tener al menos 7 caracteres validos").max(9, "La cédula no puede tener mas de 9 caracteres").optional(),
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(50, "El nombre no puede tener mas de 50 caracteres").optional(),
    telefono: z.string().min(7, "El telefono debe tener al menos 7 caracteres validos").max(15, "El telefono no puede tener mas de 15 caracteres").optional(),
    status: z.string().optional()
});

export type Clientes = z.infer<typeof clientesSchema>;
export type UpdateClientes = z.infer<typeof updateClientesSchema>;