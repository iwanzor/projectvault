import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

export async function listCurrencies(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.CurrencyWhereInput = search
    ? { OR: [{ name: { contains: search } }, { currencyCode: { contains: search } }, { symbol: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.currency.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.currency.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getCurrencyById(id: number) {
  const currency = await prisma.currency.findUnique({ where: { id } });
  if (!currency) throw new NotFoundError("Currency not found");
  return currency;
}

export async function createCurrency(data: { currencyCode: string; name: string; symbol?: string; conversionRate?: number }) {
  try {
    return await prisma.currency.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Currency code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateCurrency(id: number, data: { currencyCode?: string; name?: string; symbol?: string; conversionRate?: number }) {
  try {
    return await prisma.currency.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Currency code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Currency not found");
    }
    throw error;
  }
}

export async function deleteCurrency(id: number) {
  try {
    return await prisma.currency.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Currency not found");
      if (error.code === "P2003") throw new AppError("Cannot delete: currency is in use", 409, "HAS_DEPENDENCIES");
    }
    throw error;
  }
}
