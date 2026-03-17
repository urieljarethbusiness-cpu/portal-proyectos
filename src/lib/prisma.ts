import { PrismaClient } from "@/generated/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let internalPrisma = globalForPrisma.prisma;

// Force re-instantiation if the cached client is missing new models
if (internalPrisma && !(internalPrisma as any).note) {
  console.log("Prisma: cached client is outdated. Re-initializing...");
  internalPrisma = new PrismaClient();
} else if (!internalPrisma) {
  internalPrisma = new PrismaClient();
}

export const prisma = internalPrisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
