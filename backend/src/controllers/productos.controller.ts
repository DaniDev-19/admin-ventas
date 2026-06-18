import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productos.services';
import { enrichAndNext } from '../utils/nextError';

export const getProductsAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationMs = Date.now() - (req.startTime?.getTime() ?? Date.now()); 
        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ProductService(prisma);
        const { page, limit, search, status } = req.query;
        const result = await service.findAll({
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            search: typeof search === 'string' ? search : undefined,
            status: typeof status === 'string' ? status : undefined,
        });
        res.status(200).json({
            status: 'success',
            data: result,
            timeResponseMs: durationMs,
            timeResponseISO: new Date().toISOString(),
        });
    } catch (err) {
        enrichAndNext( err, next);
    }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationsMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ProductService(prisma);
        const id = Number(req.params.id);
        if (isNaN(id)) throw new Error('Invalid id');
        const product = await service.findByid(id);
        res.status(200).json({
            data: product,
            status: 'success',
            timeResponseMs: durationsMs,
            timeResponseISO: new Date().toISOString(),
        });
    } catch (err) {
        enrichAndNext(err, next);
    }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationsMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ProductService(prisma);
        const created = await service.create(req.body);
        res.status(201).json({
            data: created,
            status: 'success',
            timeResponseMs: durationsMs,
            timeResponseISO: new Date().toISOString(),
        })
    } catch (err) {
        enrichAndNext(err, next);
    }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationsMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ProductService(prisma);
        const id = Number(req.params.id);
        if (isNaN(id)) throw new Error("invalid id");
        const update = await service.update(id, req.body);
        res.status(200).json({
            status: 'success',
            data: update,
            timeResponseMs: durationsMs,
            timeResponseISO: new Date().toISOString(), 
        });
    } catch (err) {
        enrichAndNext(err, next);
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationsMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ProductService(prisma);
        const id = Number(req.params.id);
        if (isNaN(id)) throw new Error("invalid id");
        const trashkan = await service.delete(id);
        res.status(200).json({ 
            status: "success",
            data: trashkan,
            timeResponseMs: durationsMs,
            timeResponseISO: new Date().toISOString(),
        });
    } catch (err) {
        enrichAndNext(err, next);
    }
};