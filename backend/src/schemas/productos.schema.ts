import { z } from "zod";

export const createProductSchema = z.object({
  nombre: z
    .string({
      error: "El nombre debe ser una cadena de texto valida",
    })
    .nonempty("El nombre es obligatorio")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede tener más de 50 caracteres"),
  precio_usd: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") return Number(val);
      return val;
    },
    z
      .number({ error: "El precio debe ser un número" })
      .min(0, "El precio debe ser mayor o igual a 0"),
  ),
  stock: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") return Number(val);
      return val;
    },
    z
      .number({ error: "El stock debe ser un número entero" })
      .int("El stock debe ser un entero")
      .min(0, "El stock no puede ser negativo"),
  ),

  categoria: z
    .string()
    .max(250, "La categoria no puede tener más de 250 caracteres")
    .optional(),
  status: z.string().max(50, "Status demasiado largo").optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;