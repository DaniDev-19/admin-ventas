import type { PrismaClient } from "../generated/prisma/client";
import { clientesSchema, updateClientesSchema } from '../schemas/clientes.schema';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';

export class ClientesService {
  constructor(private db: PrismaClient) { }

  async findAll(opts?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(opts?.page ?? 1, 1);
    const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (opts?.status) where.status = opts.status;
    if (opts?.search)
      where.OR = [
        { nombre: { contains: opts.search, mode: "insensitive" } },
        { cedula: { contains: opts.search } },
      ];
    const [items, total] = await this.db.$transaction([
      this.db.clientes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      this.db.clientes.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findByid(id: number) {
    const clienteItem = await this.db.clientes.findUnique({ where: { id } });
    if (!clienteItem) throw new NotFoundError("Cliente no encontrado");
    return clienteItem;
  }

  async create(input: unknown) {
    const parsed = clientesSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Datos de cliente inválidos", parsed.error.flatten());
    const data = parsed.data;
    const exists = await this.db.clientes.findUnique({
      where: { cedula: data.cedula },
    });
    if (exists) throw new ConflictError("Ya existe un cliente con esa cédula");
    const clienteItem = await this.db.clientes.create({ data });
    return clienteItem;
  }

  async update(id: number, input: unknown) {
    const parsed = updateClientesSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Datos de cliente inválidos", parsed.error.flatten());
    const data = parsed.data;
    if (data.cedula) {
      const other = await this.db.clientes.findUnique({
        where: { cedula: data.cedula },
      });
      if (other && other.id !== id) throw new ConflictError("Cédula en uso por otro cliente");
    }
    const clienteItem = await this.db.clientes.update({ where: { id }, data });
    return clienteItem;
  }

  async delete(id: number) {
    const exist = await this.db.clientes.findUnique({ where: { id } });
    if (!exist) throw new NotFoundError("Cliente no encontrado");
    const clienteItem = await this.db.clientes.delete({
      where: { id },
      select: { id: true, nombre: true },
    });
    return clienteItem;
  }
}