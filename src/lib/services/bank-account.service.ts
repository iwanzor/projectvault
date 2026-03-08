import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listBankAccountsSchema,
  createBankAccountSchema,
  updateBankAccountSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listBankAccountsSchema>;
type CreateData = z.infer<typeof createBankAccountSchema>;
type UpdateData = z.infer<typeof updateBankAccountSchema>;

export async function listBankAccounts(params: ListParams) {
  const { page, pageSize, search, bankId, sortBy, sortOrder } = params;
  const where: Prisma.BankAccountWhereInput = {
    ...(bankId ? { bankId } : {}),
    ...(search
      ? {
          OR: [
            { accountNo: { contains: search } },
            { accountType: { contains: search } },
            { bank: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.bankAccount.findMany({
      where,
      include: {
        bank: { select: { id: true, name: true, bankCode: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bankAccount.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getBankAccountById(id: number) {
  const account = await prisma.bankAccount.findUnique({
    where: { id },
    include: {
      bank: { select: { id: true, name: true, bankCode: true } },
    },
  });
  if (!account) throw new NotFoundError("Bank account not found");
  return account;
}

export async function createBankAccount(data: CreateData) {
  try {
    return await prisma.bankAccount.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new AppError("Account already exists for this bank", 409, "DUPLICATE");
      if (error.code === "P2003")
        throw new AppError("Invalid bank reference", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateBankAccount(id: number, data: UpdateData) {
  try {
    return await prisma.bankAccount.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new AppError("Account already exists for this bank", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Bank account not found");
    }
    throw error;
  }
}

export async function deleteBankAccount(id: number) {
  try {
    return await prisma.bankAccount.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Bank account not found");
    throw error;
  }
}
