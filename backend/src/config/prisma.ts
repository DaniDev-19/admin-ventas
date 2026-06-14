// Try to load PostgreSQL adapter for Prisma client when available.
let adapter: any | undefined;
// Prefer the 'library' engine when not explicitly set to avoid requiring an adapter.
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaPg } = require("@prisma/adapter-pg");
    adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
} catch (e) {
    // adapter not installed — Prisma will require adapter or accelerateUrl if engine type is 'client'
    adapter = undefined;
}

import { PrismaClient } from "../generated/prisma/client";

declare global {
    // Evita múltiples instancias durante el desarrollo (nodemon/hot-reload)
    // eslint-disable-next-line no-var
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

