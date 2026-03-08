import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type { listItemsSchema, createItemSchema } from "@/lib/validators/item";

type ListItemsParams = z.infer<typeof listItemsSchema>;
type CreateItemData = z.infer<typeof createItemSchema>;

export async function listItems(params: ListItemsParams) {
  const { page, pageSize, search, sortBy, sortOrder, brandId, mainCategoryId, subCategory1Id, subCategory2Id, itemType, isActive } = params;

  const where: Prisma.ItemWhereInput = {
    ...(brandId ? { brandId } : {}),
    ...(mainCategoryId ? { mainCategoryId } : {}),
    ...(subCategory1Id ? { subCategory1Id } : {}),
    ...(subCategory2Id ? { subCategory2Id } : {}),
    ...(itemType ? { itemType } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { barcode: { contains: search } },
            { modelNo: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        mainCategory: { select: { id: true, name: true } },
        subCategory1: { select: { id: true, name: true } },
        subCategory2: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        packingType: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.item.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getItemById(id: number) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      brand: true,
      mainCategory: true,
      subCategory1: true,
      subCategory2: true,
      unit: true,
      packingType: true,
      comboChildren: { include: { childItem: { select: { id: true, barcode: true, name: true } } } },
      itemSuppliers: { include: { supplier: { select: { id: true, supplierCode: true, name: true } } } },
    },
  });
  if (!item) throw new NotFoundError("Item not found");
  return item;
}

export async function createItem(data: CreateItemData, createdBy?: string) {
  try {
    return await prisma.item.create({
      data: { ...data, createdBy, updatedBy: createdBy },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Barcode already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid reference: check brand, category, unit IDs", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateItem(id: number, data: Partial<CreateItemData>, updatedBy?: string) {
  try {
    return await prisma.item.update({
      where: { id },
      data: { ...data, updatedBy },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Barcode already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid reference: check brand, category, unit IDs", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("Item not found");
    }
    throw error;
  }
}

export async function deleteItem(id: number) {
  const [combos, sqDetails] = await Promise.all([
    prisma.comboItem.count({ where: { OR: [{ parentItemId: id }, { childItemId: id }] } }),
    prisma.salesQuotationDetail.count({ where: { quotation: { details: { some: {} } } } }).catch(() => 0),
  ]);
  if (combos > 0) throw new AppError("Cannot delete: item is used in combo items", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.item.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Item not found");
      if (error.code === "P2003") throw new AppError("Cannot delete: item is referenced by other records", 409, "HAS_DEPENDENCIES");
    }
    throw error;
  }
}
