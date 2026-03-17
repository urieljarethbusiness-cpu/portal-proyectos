import { prisma } from "./src/lib/prisma";

console.log("Prisma keys:", Object.keys(prisma));
if ((prisma as any).note) console.log("prisma.note exists");
if ((prisma as any).notes) console.log("prisma.notes exists");
process.exit(0);
