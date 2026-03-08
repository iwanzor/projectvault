import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";
import type { z } from "zod/v4";
import type { createSupplierSchema } from "@/lib/validators/supplier";

type CreateSupplierData = z.infer<typeof createSupplierSchema>;

export async function listSuppliers(params: ListParams & { cityId?: number; isImport?: boolean }) {
  const { page, pageSize, search, sortBy, sortOrder, cityId, isImport } = params;
  const where: Prisma.SupplierWhereInput = {
    ...(cityId ? { cityId } : {}),
    ...(isImport !== undefined ? { isImport } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { supplierCode: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        area: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getSupplierById(id: number) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      area: { include: { city: { include: { country: true } } } },
      city: { include: { country: true } },
      itemSuppliers: { include: { item: { select: { id: true, barcode: true, name: true } } } },
    },
  });
  if (!supplier) throw new NotFoundError("Supplier not found");
  return supplier;
}

export async function createSupplier(data: CreateSupplierData) {
  try {
    return await prisma.supplier.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Supplier code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid area or city reference", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateSupplier(id: number, data: Partial<CreateSupplierData>) {
  try {
    return await prisma.supplier.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Supplier code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid area or city reference", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("Supplier not found");
    }
    throw error;
  }
}

export async function deleteSupplier(id: number) {
  const deps = await prisma.itemSupplier.count({ where: { supplierId: id } });
  if (deps > 0) throw new AppError("Cannot delete: supplier has associated items", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.supplier.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Supplier not found");
      if (error.code === "P2003") throw new AppError("Cannot delete: supplier is referenced by other records", 409, "HAS_DEPENDENCIES");
    }
    throw error;
  }
}
