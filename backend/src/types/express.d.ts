import "express-serve-static-core";
import type { PrismaClient } from "../generated/prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    startTime?: Date;
    prisma?: PrismaClient;
    user?: {
      id: number;
      username: string;
      rol: string;
    };
  }
}
