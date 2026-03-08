import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listRemarksSchema,
  createRemarkSchema,
  updateRemarkSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listRemarksSchema>;
type CreateData = z.infer<typeof createRemarkSchema>;
type UpdateData = z.infer<typeof updateRemarkSchema>;

export async function listRemarks(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.AccRemarkWhereInput = search
    ? { OR: [{ remarkCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.accRemark.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.accRemark.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getRemarkById(id: number) {
  const item = await prisma.accRemark.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Remark not found");
  return item;
}

export async function createRemark(data: CreateData) {
  try {
    return await prisma.accRemark.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Remark code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateRemark(id: number, data: UpdateData) {
  try {
    return await prisma.accRemark.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Remark code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Remark not found");
    }
    throw error;
  }
}

export async function deleteRemark(id: number) {
  try {
    return await prisma.accRemark.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Remark not found");
    throw error;
  }
}
