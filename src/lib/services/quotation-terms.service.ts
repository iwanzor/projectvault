import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

export async function listQuotationTerms(params: ListParams) {
  const { page, pageSize, search, sortOrder } = params;
  // QuotationTerms doesn't have 'name' field, default to 'quotationTermsCode'
  const sortBy = params.sortBy === "name" ? "quotationTermsCode" : params.sortBy;
  const where: Prisma.QuotationTermsWhereInput = search
    ? { OR: [{ terms: { contains: search } }, { quotationTermsCode: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.quotationTerms.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.quotationTerms.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getQuotationTermsById(id: number) {
  const qt = await prisma.quotationTerms.findUnique({ where: { id } });
  if (!qt) throw new NotFoundError("Quotation terms not found");
  return qt;
}

export async function createQuotationTerms(data: { quotationTermsCode: string; terms: string }) {
  try {
    return await prisma.quotationTerms.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Quotation terms code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateQuotationTerms(id: number, data: { quotationTermsCode?: string; terms?: string }) {
  try {
    return await prisma.quotationTerms.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Quotation terms code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Quotation terms not found");
    }
    throw error;
  }
}

export async function deleteQuotationTerms(id: number) {
  const deps = await prisma.salesQuotationMaster.count({ where: { quotationTermsId: id } });
  if (deps > 0) throw new AppError("Cannot delete: quotation terms is used in quotations", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.quotationTerms.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Quotation terms not found");
    throw error;
  }
}
