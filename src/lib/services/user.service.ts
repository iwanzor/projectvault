import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import bcrypt from "bcryptjs";
import type { ListUsersParams } from "@/lib/validators/admin";

// Fields to select when returning user data (excludes passwordHash)
const userSelect = {
  id: true,
  branchCode: true,
  userCode: true,
  username: true,
  pcName: true,
  voucherPrefix: true,
  loginStatus: true,
  isAdmin: true,
  isActive: true,
  failedAttempts: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function listUsers(params: ListUsersParams) {
  const { page, pageSize, search, sortBy, sortOrder, isActive, isAdmin, branchCode } = params;

  const where: Prisma.UserWhereInput = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(isAdmin !== undefined ? { isAdmin } : {}),
    ...(branchCode ? { branchCode } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search } },
            { userCode: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      privileges: true,
    },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function createUser(data: {
  username: string;
  userCode: string;
  password: string;
  branchCode: string;
  isAdmin?: boolean;
  isActive?: boolean;
}) {
  const { password, ...rest } = data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    return await prisma.user.create({
      data: { ...rest, passwordHash },
      select: userSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Username or user code already exists", 409, "DUPLICATE");
    }
    throw error;
  }
}

export async function updateUser(
  id: number,
  data: {
    username?: string;
    userCode?: string;
    branchCode?: string;
    isAdmin?: boolean;
    isActive?: boolean;
  }
) {
  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Username or user code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("User not found");
    }
    throw error;
  }
}

export async function deleteUser(id: number, currentUserId: number) {
  if (id === currentUserId) {
    throw new AppError("Cannot delete your own account", 400, "SELF_DELETE");
  }

  try {
    await prisma.user.delete({ where: { id } });
    return { message: "User deleted successfully" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError("User not found");
    }
    throw error;
  }
}

export async function changePassword(id: number, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  try {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return { message: "Password changed successfully" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError("User not found");
    }
    throw error;
  }
}

export async function setPermissions(
  userId: number,
  permissions: Array<{
    module: string;
    viewAll: boolean;
    viewDetails: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>
) {
  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  // Delete existing and create new in a transaction
  await prisma.$transaction([
    prisma.userPrivilege.deleteMany({ where: { userId } }),
    ...permissions.map((p) =>
      prisma.userPrivilege.create({
        data: {
          userId,
          module: p.module as Prisma.UserPrivilegeCreateInput["module"],
          viewAll: p.viewAll,
          viewDetails: p.viewDetails,
          canAdd: p.canAdd,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        },
      })
    ),
  ]);

  return getPermissions(userId);
}

export async function getPermissions(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  return prisma.userPrivilege.findMany({
    where: { userId },
    orderBy: { module: "asc" },
  });
}

export async function getUserSessions(userId: number) {
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getUserStats() {
  const [total, active, admin] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isAdmin: true } }),
  ]);
  return { total, active, admin };
}
