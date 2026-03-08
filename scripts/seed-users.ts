import type { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  console.log("  Seeding users and privileges...");

  const passwordHash = await bcrypt.hash("User@123", 10);
  const adminHash = await bcrypt.hash("Admin@123", 10);

  // Admin user
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      userCode: "ADMIN",
      username: "admin",
      passwordHash: adminHash,
      branchCode: "HQ",
      isAdmin: true,
      isActive: true,
    },
  });

  // Sample users
  const users = [
    { userCode: "SALES01", username: "sales_user", branchCode: "HQ" },
    { userCode: "WH01", username: "warehouse_user", branchCode: "HQ" },
    { userCode: "ACC01", username: "accountant", branchCode: "HQ" },
    { userCode: "PM01", username: "project_manager", branchCode: "HQ" },
    { userCode: "VIEW01", username: "viewer", branchCode: "HQ" },
    { userCode: "SALES02", username: "sales_manager", branchCode: "HQ" },
    { userCode: "WH02", username: "store_keeper", branchCode: "HQ" },
    { userCode: "ENG01", username: "site_engineer", branchCode: "HQ" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash, isAdmin: false, isActive: true },
    });
  }

  // Assign privileges
  type ModuleName = "SALES" | "SETUP" | "PROJECT" | "ACCOUNT" | "WAREHOUSE" | "REPORTS";
  const allModules: ModuleName[] = ["SALES", "SETUP", "PROJECT", "ACCOUNT", "WAREHOUSE", "REPORTS"];

  const full = { viewAll: true, viewDetails: true, canAdd: true, canEdit: true, canDelete: true };
  const viewOnly = { viewAll: true, viewDetails: true, canAdd: false, canEdit: false, canDelete: false };

  const rolePermissions: Record<string, Partial<Record<ModuleName, typeof full>>> = {
    sales_user: { SALES: full, SETUP: viewOnly },
    warehouse_user: { WAREHOUSE: full, SETUP: viewOnly },
    accountant: { ACCOUNT: full, REPORTS: full },
    project_manager: { PROJECT: full, SALES: viewOnly, WAREHOUSE: viewOnly },
    viewer: Object.fromEntries(allModules.map(m => [m, viewOnly])) as Record<ModuleName, typeof viewOnly>,
    sales_manager: { SALES: full, SETUP: full, REPORTS: viewOnly },
    store_keeper: { WAREHOUSE: full },
    site_engineer: { PROJECT: viewOnly, WAREHOUSE: viewOnly },
  };

  for (const [username, perms] of Object.entries(rolePermissions)) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) continue;

    for (const [mod, flags] of Object.entries(perms)) {
      await prisma.userPrivilege.upsert({
        where: { userId_module: { userId: user.id, module: mod as ModuleName } },
        update: flags!,
        create: { userId: user.id, module: mod as ModuleName, ...flags! },
      });
    }
  }

  console.log("  ✓ Users and privileges seeded");
}
