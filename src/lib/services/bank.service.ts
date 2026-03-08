import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listBanksSchema,
  createBankSchema,
  updateBankSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listBanksSchema>;
type CreateData = z.infer<typeof createBankSchema>;
type UpdateData = z.infer<typeof updateBankSchema>;

export async function listBanks(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.BankWhereInput = search
    ? {
        OR: [
          { bankCode: { contains: search } },
          { name: { contains: search } },
          { branchCode: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.bank.findMany({
      where,
      include: {
        city: { select: { id: true, name: true } },
        _count: { select: { accounts: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bank.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getBankById(id: number) {
  const bank = await prisma.bank.findUnique({
    where: { id },
    include: {
      city: { select: { id: true, name: true } },
      accounts: true,
    },
  });
  if (!bank) throw new NotFoundError("Bank not found");
  return bank;
}

export async function createBank(data: CreateData) {
  try {
    return await prisma.bank.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Bank code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateBank(id: number, data: UpdateData) {
  try {
    return await prisma.bank.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Bank code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Bank not found");
    }
    throw error;
  }
}

export async function deleteBank(id: number) {
  const deps = await prisma.bankAccount.count({ where: { bankId: id } });
  if (deps > 0) throw new AppError("Cannot delete: bank has associated accounts", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.bank.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Bank not found");
    throw error;
  }
}
