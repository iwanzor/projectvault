import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listDepartmentsSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listDepartmentsSchema>;
type CreateData = z.infer<typeof createDepartmentSchema>;
type UpdateData = z.infer<typeof updateDepartmentSchema>;

export async function listDepartments(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.AccDepartmentWhereInput = search
    ? { OR: [{ departmentCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.accDepartment.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.accDepartment.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getDepartmentById(id: number) {
  const item = await prisma.accDepartment.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Department not found");
  return item;
}

export async function createDepartment(data: CreateData) {
  try {
    return await prisma.accDepartment.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Department code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateDepartment(id: number, data: UpdateData) {
  try {
    return await prisma.accDepartment.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Department code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Department not found");
    }
    throw error;
  }
}

export async function deleteDepartment(id: number) {
  try {
    return await prisma.accDepartment.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Department not found");
    throw error;
  }
}
