import { Request, Response, NextFunction } from 'express'
import type { PrismaClient } from '../generated/prisma/client'
import { VentasService } from '../services/ventas.services'
import { enrichAndNext } from '../utils/nextError'
import { ventaResponseSchema, createVentaSchema } from '../schemas/ventas.schema'

export const getAllVentas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient | undefined = req.prisma as any
    if (!prisma) throw new Error('database the client not found in request')
    const service = new VentasService(prisma)
    const page = Number(req.query.page ? String(req.query.page) : '1')
    const limit = Number(req.query.limit ? String(req.query.limit) : '20')
    const search = req.query.search ? String(req.query.search) : undefined
    const status = req.query.status ? String(req.query.status) : undefined
    const result = await service.findAll({ page: isNaN(page) ? 1 : page, limit: isNaN(limit) ? 20 : limit, search, status })
    const out = result.data.map((v) => ventaResponseSchema.parse({ ...v, created_at: v.created_at, updated_at: v.updated_at }))
    res.status(200).json({ status: 'success', data: out, meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages } })
  } catch (err) {
    enrichAndNext(err, next)
  }
}

export const getVentaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient | undefined = req.prisma as any
    if (!prisma) throw new Error('database the client not found in request')
    const service = new VentasService(prisma)
    const id = Number(req.params.id)
    if (isNaN(id)) throw new Error('Invalid id')
    const venta = await service.findById(id)
    const out = ventaResponseSchema.parse({ ...venta, created_at: venta.created_at, updated_at: venta.updated_at })
    res.status(200).json({ status: 'success', data: out })
  } catch (err) {
    enrichAndNext(err, next)
  }
}

export const createVenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient | undefined = req.prisma as any
    if (!prisma) throw new Error('database the client not found in request')

    const service = new VentasService(prisma)

    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotency_key

    const parsed = createVentaSchema.parse(req.body)

    const created = await service.create(parsed, idempotencyKey)

    const out = ventaResponseSchema.parse({ ...created, created_at: created.created_at, updated_at: created.updated_at })
    res.status(201).json({ status: 'success', data: out })
  } catch (err) {
    enrichAndNext(err, next)
  }
}

export const deleteVenta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient | undefined = req.prisma as any
    if (!prisma) throw new Error('database the client not found in request')
    const service = new VentasService(prisma)
    const id = Number(req.params.id)
    if (isNaN(id)) throw new Error('Invalid id')
    const deleted = await service.delete(id)
    const out = ventaResponseSchema.parse({ ...deleted, created_at: deleted.created_at, updated_at: deleted.updated_at })
    res.status(200).json({ status: 'success', data: out })
  } catch (err) {
    enrichAndNext(err, next)
  }
}

export const deleteVentaNoRestore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient | undefined = req.prisma as any
    if (!prisma) throw new Error('database the client not found in request')
    const service = new VentasService(prisma)
    const id = Number(req.params.id)
    if (isNaN(id)) throw new Error('Invalid id')
    const deleted = await service.deleteWithoutRestore(id)
    const out = ventaResponseSchema.parse({ ...deleted, created_at: deleted.created_at, updated_at: deleted.updated_at })
    res.status(200).json({ status: 'success', data: out })
  } catch (err) {
    enrichAndNext(err, next)
  }
}


