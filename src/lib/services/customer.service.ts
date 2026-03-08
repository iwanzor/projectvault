import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";
import type { z } from "zod/v4";
import type { createCustomerSchema } from "@/lib/validators/customer";

type CreateCustomerData = z.infer<typeof createCustomerSchema>;

export async function listCustomers(params: ListParams & { areaId?: number; cityId?: number; isExport?: boolean }) {
  const { page, pageSize, search, sortBy, sortOrder, areaId, cityId, isExport } = params;
  const where: Prisma.CustomerWhereInput = {
    ...(areaId ? { areaId } : {}),
    ...(cityId ? { cityId } : {}),
    ...(isExport !== undefined ? { isExport } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { customerCode: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        area: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getCustomerById(id: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      area: { include: { city: { include: { country: true } } } },
      city: { include: { country: true } },
    },
  });
  if (!customer) throw new NotFoundError("Customer not found");
  return customer;
}

export async function createCustomer(data: CreateCustomerData) {
  try {
    return await prisma.customer.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Customer code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid area or city reference", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateCustomer(id: number, data: Partial<CreateCustomerData>) {
  try {
    return await prisma.customer.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Customer code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Invalid area or city reference", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("Customer not found");
    }
    throw error;
  }
}

export async function deleteCustomer(id: number) {
  const deps = await prisma.salesQuotationMaster.count({ where: { customerId: id } });
  if (deps > 0) throw new AppError("Cannot delete: customer has associated quotations", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.customer.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Customer not found");
      if (error.code === "P2003") throw new AppError("Cannot delete: customer is referenced by other records", 409, "HAS_DEPENDENCIES");
    }
    throw error;
  }
}
