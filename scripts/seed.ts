import dotenv from "dotenv";
import { readFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { seedUsers } from "./seed-users";
import { seedSetup } from "./seed-setup";
import { seedMaster } from "./seed-master";
import { seedTransactions } from "./seed-transactions";

// Load .env without dotenv-expand (which mangles $ in passwords)
dotenv.config({ override: true });
// Fix escaped \$ back to literal $ (needed because .env uses \$ for Next.js compatibility)
for (const key of ["DB_PASSWORD", "DATABASE_URL"]) {
  if (process.env[key]) {
    process.env[key] = process.env[key]!.replace(/\\\$/g, "$");
  }
}

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT ?? "3306"),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting ProjectVault seed...\n");

  const start = Date.now();

  await seedUsers(prisma);
  await seedSetup(prisma);
  await seedMaster(prisma);
  await seedTransactions(prisma);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Seed completed in ${elapsed}s`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
