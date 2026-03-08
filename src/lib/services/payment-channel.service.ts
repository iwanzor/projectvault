import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listPaymentChannelsSchema,
  createPaymentChannelSchema,
  updatePaymentChannelSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listPaymentChannelsSchema>;
type CreateData = z.infer<typeof createPaymentChannelSchema>;
type UpdateData = z.infer<typeof updatePaymentChannelSchema>;

export async function listPaymentChannels(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.PaymentChannelWhereInput = search
    ? { OR: [{ paymentChannelCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.paymentChannel.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.paymentChannel.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getPaymentChannelById(id: number) {
  const item = await prisma.paymentChannel.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Payment channel not found");
  return item;
}

export async function createPaymentChannel(data: CreateData) {
  try {
    return await prisma.paymentChannel.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Payment channel code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updatePaymentChannel(id: number, data: UpdateData) {
  try {
    return await prisma.paymentChannel.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Payment channel code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Payment channel not found");
    }
    throw error;
  }
}

export async function deletePaymentChannel(id: number) {
  try {
    return await prisma.paymentChannel.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Payment channel not found");
    throw error;
  }
}
