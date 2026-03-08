import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // PrismaMariaDb uses mariadb package internally - pass config object
  const adapter = new PrismaMariaDb({
    host: "46.101.215.137",
    port: 3306,
    user: "projectvault",
    password: "K7m$Q4vL9xR2pT8",
    database: "projectvault",
    connectionLimit: 10,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
