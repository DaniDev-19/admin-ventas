import { z } from 'zod';

export const tasaMonedaSchema = z.object({
	id: z.number().int().positive().optional(),
	moneda: z.string().max(50).optional().default('Bs'),
	tasa_usd: z.coerce.number().nullable(),
	tasa_euro: z.coerce.number().nullable(),
	tasa_paralelo: z.coerce.number().nullable().optional(),
	created_at: z.preprocess((arg) => (arg ? new Date(arg as any) : undefined), z.date().optional()),
	updated_at: z.preprocess((arg) => (arg ? new Date(arg as any) : undefined), z.date().optional()),
})

export const createTasaMonedaSchema = z.object({
	moneda: z.string().max(50).optional().default('Bs'),
	tasa_usd: z.coerce.number().nullable(),
	tasa_euro: z.coerce.number().nullable(),
	tasa_paralelo: z.coerce.number().nullable().optional(),
})

export const updateTasaMonedaSchema = z.object({
	moneda: z.string().max(50).optional(),
	tasa_usd: z.coerce.number().nullable().optional(),
	tasa_euro: z.coerce.number().nullable().optional(),
	tasa_paralelo: z.coerce.number().nullable().optional(),
})

export type TasaMoneda = z.infer<typeof tasaMonedaSchema>

export type CreateTasaMoneda = z.infer<typeof createTasaMonedaSchema>

export type UpdateTasaMoneda = z.infer<typeof updateTasaMonedaSchema>