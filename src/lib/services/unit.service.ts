import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

// ─── Unit ────────────────────────────────────────────

export async function listUnits(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.UnitWhereInput = search
    ? { OR: [{ name: { contains: search } }, { unitCode: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.unit.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.unit.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getUnitById(id: number) {
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) throw new NotFoundError("Unit not found");
  return unit;
}

export async function createUnit(data: { unitCode: string; name: string }) {
  try {
    return await prisma.unit.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Unit code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateUnit(id: number, data: { unitCode?: string; name?: string }) {
  try {
    return await prisma.unit.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Unit code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Unit not found");
    }
    throw error;
  }
}

export async function deleteUnit(id: number) {
  const deps = await prisma.item.count({ where: { unitId: id } });
  if (deps > 0) throw new AppError("Cannot delete: unit has associated items", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.unit.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Unit not found");
    throw error;
  }
}

// ─── PackingType ─────────────────────────────────────

export async function listPackingTypes(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.PackingTypeWhereInput = search
    ? { OR: [{ name: { contains: search } }, { packingTypeCode: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.packingType.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.packingType.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getPackingTypeById(id: number) {
  const pt = await prisma.packingType.findUnique({ where: { id } });
  if (!pt) throw new NotFoundError("Packing type not found");
  return pt;
}

export async function createPackingType(data: { packingTypeCode: string; name: string }) {
  try {
    return await prisma.packingType.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Packing type code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updatePackingType(id: number, data: { packingTypeCode?: string; name?: string }) {
  try {
    return await prisma.packingType.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Packing type code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Packing type not found");
    }
    throw error;
  }
}

export async function deletePackingType(id: number) {
  const deps = await prisma.item.count({ where: { packingTypeId: id } });
  if (deps > 0) throw new AppError("Cannot delete: packing type has associated items", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.packingType.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Packing type not found");
    throw error;
  }
}
