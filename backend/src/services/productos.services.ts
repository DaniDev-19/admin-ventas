import type { PrismaClient } from "../generated/prisma/client";
import { createProductSchema, updateProductSchema } from '../schemas/productos.schema';

class ValidationError extends Error { constructor(public details: any) { super("Validation"); } }
class NotFoundError extends Error{}
class ConflictError extends Error{}

export class ProductService {
    constructor(private db: PrismaClient) {}

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
        { nombre: { contains: opts?.search, mode: "insensitive"} }, 
        { cedula: { contains: opts.search } },
    ];
    const [items, total] = await this.db.$transaction([
        this.db.productos.findMany({
            where, 
            skip,
            take: limit,
            orderBy: { id: "desc" },
        }),
        this.db.productos.count({ where }),
    ]);
    return { items, total, page, limit };
}

async findByid(id: number) {
    const productItem = await this.db.productos.findUnique({ where: { id } });
    if(!productItem) throw new ValidationError("Producto no encontrado");
    return productItem;
}

async create(input: unknown) {
    const parsed = createProductSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());
    const data = parsed.data;
    const nombreNormalizado = data.nombre?.trim();
    const exists = await this.db.productos.findFirst({
        where: { nombre: { equals: nombreNormalizado, mode: "insensitive"} },
    });
    if (exists) throw new ConflictError("ya existe un producto con ese nombre");
    const productItem = await this.db.productos.create( {data: {  ...data, nombre: nombreNormalizado } });
    return productItem
}

async update(id: number, input: unknown) {
    const parsed = updateProductSchema.safeParse(input);
    if(!parsed.success) throw new ValidationError(parsed.error.flatten());
    const data: any = parsed.data;
    const product = await this.db.productos.findUnique({
        where: { id }
    });
    if(!product) throw new NotFoundError("Prodcuto no encontrado");
    if(data.nombre) {
        const nombreNormalizado = data.nombre.trim();
        const exists = await this.db.productos.findFirst({
            where: {
                nombre: { equals: nombreNormalizado, mode: "insensitive" },
                id: { not:id },
            },
        });
        if(exists) throw new ConflictError("Ya existe un producto con ese nombre ");
        data.nombre = nombreNormalizado;
    }
    if (data.price_usd !== undefined) data.price_usd = Number(data.price_usd);
    if (data.stock !== undefined) data.stock = Number(data.stock);

    const update = await this.db.productos.update({
      where: { id },
      data,
    });
    return update
}

async delete (id: number) {
    const product = await this.db.productos.findUnique({ where: { id } });
    if (!product) throw new ValidationError("Producto no encontrado");

    const trashkan = await this.db.productos.delete({
        where: { id }
    });
    return trashkan;

}

}