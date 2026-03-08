import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT ?? "3306"),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const user = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      userCode: "ADMIN",
      username: "admin",
      passwordHash,
      branchCode: "HQ",
      isAdmin: true,
      isActive: true,
    },
  });

  console.log("Admin user ready - id:", user.id, "username:", user.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
