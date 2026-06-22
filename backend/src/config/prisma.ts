import { PrismaClient } from "../generated/prisma/client";

let adapter: any | undefined;

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

const dbUrl = process.env.DATABASE_URL || "";
const isAccelerate = dbUrl.startsWith("prisma://");

if (!isAccelerate && dbUrl) {
    try {
        const { Pool } = require("pg");       
        const { PrismaPg } = require("@prisma/adapter-pg");
        const pool = new Pool({ connectionString: dbUrl });
        adapter = new PrismaPg(pool);
    } catch (e) {
        adapter = undefined;
    }
}

declare global {
    var prisma: PrismaClient | undefined;
}

const clientOptions: any = {
        log: process.env.NODE_ENV === "development"
                ? ["query", "info", "warn", "error"]
                : ["error"],
};

if (adapter) {
    clientOptions.adapter = adapter;
}

export const prisma = globalThis.prisma ?? new PrismaClient(clientOptions as any);

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

export default prisma;
