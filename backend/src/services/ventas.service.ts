import type { PrismaClient } from '../generated/prisma/client'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';

export class VentasService {
  constructor(private db: PrismaClient) {}


  async findAll(opts?: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = Math.max(1, opts?.page ?? 1)
    const limit = Math.min(100, Math.max(1, opts?.limit ?? 20))
    const skip = (page - 1) * limit
    const where: any = {}

    if (opts?.status) where.status = opts.status

    if (opts?.search) {
      const q = String(opts.search)
      where.OR = [
        { clientes: { nombre: { contains: q, mode: 'insensitive' } } },
        { clientes: { cedula: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [total, data] = await Promise.all([
      this.db.ventas.count({ where }),
      this.db.ventas.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
    ])

    const pages = Math.max(1, Math.ceil(total / limit))
    return { data, total, page, limit, pages }
  }


  async findById(id: number) {
    const venta = await this.db.ventas.findUnique({ where: { id } })
    if (!venta) throw new NotFoundError('Venta no encontrada')
    return venta
  }

  async create(input: {
    clientes_id: number
    productos_id: number
    tasa_moneda_id: number
    cantidad: number
    precio_unitario: number
  }, idempotencyKey?: string) {
    if (!idempotencyKey) throw new ValidationError('Idempotency-Key requerido')

    const { clientes_id, productos_id, tasa_moneda_id, cantidad, precio_unitario } = input

    const result = await this.db.$transaction(async (tx) => {
      const existing = await tx.ventas_idempotency.findUnique({ where: { key: idempotencyKey } })
      if (existing && existing.venta_id) {
        const venta = await tx.ventas.findUnique({ where: { id: existing.venta_id } })
        if (!venta) throw new NotFoundError('Venta referenciada por idempotency no encontrada')
        return { fromCache: true, venta }
      }

      await tx.$executeRawUnsafe('SELECT id, stock FROM productos WHERE id = $1 FOR UPDATE', productos_id)

      const producto = await tx.productos.findUnique({ where: { id: productos_id } })
      if (!producto) throw new NotFoundError('Producto no encontrado')

      if (typeof producto.stock === 'number') {
        if (producto.stock < cantidad) throw new ConflictError('Stock insuficiente')
      }

      const venta = await tx.ventas.create({
        data: {
          clientes_id,
          productos_id,
          tasa_moneda_id,
          cantidad,
          precio_unitario,
        },
      })

      if (typeof producto.stock === 'number') {
        await tx.productos.update({ where: { id: productos_id }, data: { stock: producto.stock - cantidad } })
      }

      await tx.ventas_idempotency.create({ data: { key: idempotencyKey, venta_id: venta.id, status: 'created', response: venta as any } })

      return { fromCache: false, venta }
    })

    return result.venta
  }

  async delete (id: number) {
    const result = await this.db.$transaction(async (tx) => {
      const exist = await tx.ventas.findUnique({ where: { id } })
      if (!exist) throw new NotFoundError('Venta no encontrada')

      const producto = await tx.productos.findUnique({ where: { id: exist.productos_id } })
      if (producto && typeof producto.stock === 'number') {
        await tx.productos.update({ where: { id: producto.id }, data: { stock: producto.stock + (exist.cantidad ?? 0) } })
      }

      const deleted = await tx.ventas.delete({ where: { id } })

      await tx.ventas_idempotency.updateMany({ where: { venta_id: id }, data: { status: 'deleted' } })

      return deleted
    })

    return result
  }

  async deleteWithoutRestore(id: number) {
    const result = await this.db.$transaction(async (tx) => {
      const exist = await tx.ventas.findUnique({ where: { id } })
      if (!exist) throw new NotFoundError('Venta no encontrada')

      const deleted = await tx.ventas.delete({ where: { id } })

      await tx.ventas_idempotency.updateMany({ where: { venta_id: id }, data: { status: 'deleted' } })

      return deleted
    })

    return result
  }

  async update(id: number, input: { status: string }) {
    const exist = await this.db.ventas.findUnique({ where: { id } })
    if (!exist) throw new NotFoundError('Venta no encontrada')

    const updated = await this.db.ventas.update({
      where: { id },
      data: { status: input.status }
    })
    return updated
  }
}

export default VentasService

