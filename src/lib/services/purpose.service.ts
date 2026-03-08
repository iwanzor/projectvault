import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listPurposesSchema,
  createPurposeSchema,
  updatePurposeSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listPurposesSchema>;
type CreateData = z.infer<typeof createPurposeSchema>;
type UpdateData = z.infer<typeof updatePurposeSchema>;

export async function listPurposes(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.PurposeWhereInput = search
    ? { OR: [{ purposeCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.purpose.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.purpose.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getPurposeById(id: number) {
  const item = await prisma.purpose.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Purpose not found");
  return item;
}

export async function createPurpose(data: CreateData) {
  try {
    return await prisma.purpose.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Purpose code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updatePurpose(id: number, data: UpdateData) {
  try {
    return await prisma.purpose.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Purpose code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Purpose not found");
    }
    throw error;
  }
}

export async function deletePurpose(id: number) {
  try {
    return await prisma.purpose.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Purpose not found");
    throw error;
  }
}
