import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listPositionsSchema,
  createPositionSchema,
  updatePositionSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listPositionsSchema>;
type CreateData = z.infer<typeof createPositionSchema>;
type UpdateData = z.infer<typeof updatePositionSchema>;

export async function listPositions(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.AccPositionWhereInput = search
    ? { OR: [{ positionCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.accPosition.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.accPosition.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getPositionById(id: number) {
  const item = await prisma.accPosition.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Position not found");
  return item;
}

export async function createPosition(data: CreateData) {
  try {
    return await prisma.accPosition.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Position code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updatePosition(id: number, data: UpdateData) {
  try {
    return await prisma.accPosition.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Position code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Position not found");
    }
    throw error;
  }
}

export async function deletePosition(id: number) {
  try {
    return await prisma.accPosition.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Position not found");
    throw error;
  }
}
