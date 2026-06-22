import { z } from 'zod'; 

export const createVentaSchema = z.object ({
    clientes_id: z.number().int().positive(),
    productos_id: z.number().int().positive(),
    tasa_moneda_id: z.number().int().positive(),
    cantidad: z.number().int().min(1).default(1),
    precio_unitario: z.coerce.number().positive(),
    idempotency_key: z.string().optional(),
});

export const updateVentaSchema = z.object({
    status: z.enum(['no_pagada', 'pagada', 'cancelada', 'parcialmente_pagada', 'debe']),
});

export const ventaResponseSchema = z.object({
    id: z.number().int(),
    clientes_id: z.number().int(),
    productos_id: z.number().int(),
    tasa_moneda_id: z.number().int(),
    cantidad: z.number().int(),
    precio_unitario: z.coerce.number(),
    total: z.coerce.number(),
    status: z.string(),
    created_at: z.date().optional(),
    updated_at: z.date().optional(), 
});