import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listPaymentTypesSchema,
  createPaymentTypeSchema,
  updatePaymentTypeSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listPaymentTypesSchema>;
type CreateData = z.infer<typeof createPaymentTypeSchema>;
type UpdateData = z.infer<typeof updatePaymentTypeSchema>;

export async function listPaymentTypes(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.PaymentTypeWhereInput = search
    ? { OR: [{ paymentTypeCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.paymentType.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.paymentType.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getPaymentTypeById(id: number) {
  const item = await prisma.paymentType.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Payment type not found");
  return item;
}

export async function createPaymentType(data: CreateData) {
  try {
    return await prisma.paymentType.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Payment type code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updatePaymentType(id: number, data: UpdateData) {
  try {
    return await prisma.paymentType.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Payment type code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Payment type not found");
    }
    throw error;
  }
}

export async function deletePaymentType(id: number) {
  try {
    return await prisma.paymentType.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Payment type not found");
    throw error;
  }
}
