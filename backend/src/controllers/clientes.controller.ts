import { Request, Response, NextFunction } from 'express';
import { ClientesService } from '../services/clientes.services';
import { enrichAndNext } from '../utils/nextError';

export const getClientesAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationMs = Date.now() - (req.startTime?.getTime() ?? Date.now());        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ClientesService(prisma);
        const { page, limit, search, status } = req.query;
        const result = await service.findAll({
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            search: typeof search === "string" ? search : undefined,
            status: typeof status === "string" ? status : undefined,
        });
        res.status(200).json({
            data: result,
            status: "success",
            message: "Clientes obtenidos exitosamente",
            timeResponseMs: durationMs,
            timeResponseISO: new Date().toISOString(),
        });
    }catch(err) {
        enrichAndNext(err, next);
    }
};

export const getClienteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ClientesService(prisma);
        const id = Number(req.params.id);
        if (isNaN(id)) throw new Error("Invalid Id");
        const result = await service.findByid(id);
        res.status(200).json({
            data: result,
            status: "success",
            message: "Cliente obtenido exitosamente",
            timeResponseMs: durationMs,
            timeResponseISO: new Date().toISOString(),
        }); 
    } catch (err) {
        enrichAndNext(err, next);
    }
};

export const createClient = async ( req: Request, res: Response, next: NextFunction) =>{
    try {
        const durationMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if (!prisma) throw new Error("database the client not found in request");
        const service = new ClientesService(prisma);
        const created = await service.create(req.body);
        res.status(201).json({
            data: created,
            status: "success",
            message: "Cliente creado exitosamente",
            timeResponseMs: durationMs,
            timeResponseISO: new Date().toISOString(),
        });
    }catch (err) {
        enrichAndNext(err, next);
    }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const durationMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if(!prisma) throw new Error("database the client not found in request");
        const service = new ClientesService(prisma);
        const id = Number(req.params.id);
        if (isNaN(id)) throw new Error("Invalid id");
        const result = await service.update(id, req.body);
        res.status(200).json({
            data: result,
            status: "success",
            message: "Cliente actualizado exitosamente",
            timeResponseMs: durationMs,
            timeResponseISO: new Date().toISOString() 
        });    
    } catch (error) {
        enrichAndNext(error, next);
    }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const durationMs = Date.now() - (req.startTime?.getTime() ?? Date.now());
        const prisma = req.prisma;
        if(!prisma) throw new Error("database the client not found in request");
        const service = new ClientesService(prisma);
        const id = Number(req.params.id);
        if(isNaN(id)) throw new Error("Invalid id");
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ status: "error", message: "Invalid id" });
        const result = await service.delete(id);
        res.status(200).json({
            data: result,
            status: "success",
            message: "Cliente eliminado exitosamente",
            timeResponseMs: durationMs,
            timeResponseISO: new Date().toISOString()
        });
    }catch(err){
        enrichAndNext(err, next);
    }
}