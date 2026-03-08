import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

export async function listComboItems(params: ListParams & { parentItemId?: number }) {
  const { page, pageSize, search, sortBy, sortOrder, parentItemId } = params;
  const where: Prisma.ComboItemWhereInput = {
    ...(parentItemId ? { parentItemId } : {}),
    ...(search
      ? {
          OR: [
            { parentItem: { name: { contains: search } } },
            { childItem: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  // ComboItem doesn't have createdAt, use id as default
  const effectiveSortBy = sortBy === "createdAt" ? "id" : sortBy;
  
  const [data, total] = await Promise.all([
    prisma.comboItem.findMany({
      where,
      include: {
        parentItem: { select: { id: true, barcode: true, name: true } },
        childItem: { select: { id: true, barcode: true, name: true } },
      },
      orderBy: effectiveSortBy === "name" ? { parentItem: { name: sortOrder } } : { [effectiveSortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comboItem.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getComboItemById(id: number) {
  const combo = await prisma.comboItem.findUnique({
    where: { id },
    include: {
      parentItem: { select: { id: true, barcode: true, name: true } },
      childItem: { select: { id: true, barcode: true, name: true } },
    },
  });
  if (!combo) throw new NotFoundError("Combo item not found");
  return combo;
}

export async function createComboItem(data: {
  parentItemId: number;
  childItemId: number;
  quantity?: number | null;
  estArrivalPrice?: number | null;
  fobPrice?: number | null;
  defaultPrice?: number | null;
  salesPrice?: number | null;
}) {
  if (data.parentItemId === data.childItemId) {
    throw new AppError("Parent and child item cannot be the same", 400, "INVALID_DATA");
  }
  try {
    return await prisma.comboItem.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("This combo item combination already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid item reference", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateComboItem(
  id: number,
  data: {
    parentItemId?: number;
    childItemId?: number;
    quantity?: number | null;
    estArrivalPrice?: number | null;
    fobPrice?: number | null;
    defaultPrice?: number | null;
    salesPrice?: number | null;
  }
) {
  if (data.parentItemId && data.childItemId && data.parentItemId === data.childItemId) {
    throw new AppError("Parent and child item cannot be the same", 400, "INVALID_DATA");
  }
  try {
    return await prisma.comboItem.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("This combo item combination already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid item reference", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("Combo item not found");
    }
    throw error;
  }
}

export async function deleteComboItem(id: number) {
  try {
    return await prisma.comboItem.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Combo item not found");
    throw error;
  }
}
