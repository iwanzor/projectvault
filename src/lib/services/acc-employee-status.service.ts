import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listEmployeeStatusesSchema,
  createStatusSchema,
  updateStatusSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listEmployeeStatusesSchema>;
type CreateData = z.infer<typeof createStatusSchema>;
type UpdateData = z.infer<typeof updateStatusSchema>;

export async function listEmployeeStatuses(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.AccEmployeeStatusWhereInput = search
    ? { OR: [{ statusCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.accEmployeeStatus.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.accEmployeeStatus.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getEmployeeStatusById(id: number) {
  const item = await prisma.accEmployeeStatus.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Employee status not found");
  return item;
}

export async function createEmployeeStatus(data: CreateData) {
  try {
    return await prisma.accEmployeeStatus.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Status code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateEmployeeStatus(id: number, data: UpdateData) {
  try {
    return await prisma.accEmployeeStatus.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Status code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Employee status not found");
    }
    throw error;
  }
}

export async function deleteEmployeeStatus(id: number) {
  try {
    return await prisma.accEmployeeStatus.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Employee status not found");
    throw error;
  }
}
