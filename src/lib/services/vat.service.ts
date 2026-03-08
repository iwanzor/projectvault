import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

export async function listVatRates(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.VatRateWhereInput = search
    ? { OR: [{ name: { contains: search } }, { vatCode: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.vatRate.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.vatRate.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getVatRateById(id: number) {
  const vat = await prisma.vatRate.findUnique({ where: { id } });
  if (!vat) throw new NotFoundError("VAT rate not found");
  return vat;
}

export async function createVatRate(data: { vatCode: string; name: string; vatPerc: number }) {
  try {
    return await prisma.vatRate.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("VAT code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateVatRate(id: number, data: { vatCode?: string; name?: string; vatPerc?: number }) {
  try {
    return await prisma.vatRate.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("VAT code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("VAT rate not found");
    }
    throw error;
  }
}

export async function deleteVatRate(id: number) {
  try {
    return await prisma.vatRate.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("VAT rate not found");
    throw error;
  }
}
