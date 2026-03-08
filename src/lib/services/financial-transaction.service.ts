import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listTransactionsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  transactionSummarySchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listTransactionsSchema>;
type CreateData = z.infer<typeof createTransactionSchema>;
type UpdateData = z.infer<typeof updateTransactionSchema>;
type SummaryParams = z.infer<typeof transactionSummarySchema>;

// ─── List ────────────────────────────────────────

export async function listTransactions(params: ListParams) {
  const {
    page, pageSize, search, category, projectNo, purposeCode,
    paymentChannelCode, isLocked, isArchived, dateFrom, dateTo,
    sortBy, sortOrder,
  } = params;

  const where: Prisma.FinancialTransactionWhereInput = {
    ...(category ? { category } : {}),
    ...(projectNo ? { projectNo } : {}),
    ...(purposeCode ? { purposeCode } : {}),
    ...(paymentChannelCode ? { paymentChannelCode } : {}),
    ...(isLocked !== undefined ? { isLocked } : {}),
    ...(isArchived !== undefined ? { isArchived } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { transactionNo: { contains: search } },
            { description: { contains: search } },
            { projectNo: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.financialTransaction.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.financialTransaction.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ───────────────────────────────────

export async function getTransactionById(id: number) {
  const txn = await prisma.financialTransaction.findUnique({ where: { id } });
  if (!txn) throw new NotFoundError("Transaction not found");
  return txn;
}

// ─── Create ──────────────────────────────────────

export async function createTransaction(data: CreateData) {
  const transactionNo = await getNextNumber("TXN");
  try {
    return await prisma.financialTransaction.create({
      data: { ...data, transactionNo },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Transaction number already exists", 409, "DUPLICATE");
    throw error;
  }
}

// ─── Update ──────────────────────────────────────

export async function updateTransaction(id: number, data: UpdateData) {
  try {
    return await prisma.financialTransaction.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Transaction not found");
    }
    throw error;
  }
}

// ─── Delete ──────────────────────────────────────

export async function deleteTransaction(id: number) {
  try {
    return await prisma.financialTransaction.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Transaction not found");
    throw error;
  }
}

// ─── Lock ────────────────────────────────────────

export async function lockTransaction(id: number, descriptionLock?: string) {
  try {
    return await prisma.financialTransaction.update({
      where: { id },
      data: { isLocked: true, descriptionLock: descriptionLock ?? null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Transaction not found");
    throw error;
  }
}

// ─── Archive ─────────────────────────────────────

export async function archiveTransaction(id: number, descriptionArchive?: string) {
  try {
    return await prisma.financialTransaction.update({
      where: { id },
      data: { isArchived: true, descriptionArchive: descriptionArchive ?? null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Transaction not found");
    throw error;
  }
}

// ─── Payables ────────────────────────────────────

export async function getPayables() {
  return prisma.financialTransaction.findMany({
    where: { category: "EXPENSE", isArchived: { not: true } },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Receivables ─────────────────────────────────

export async function getReceivables() {
  return prisma.financialTransaction.findMany({
    where: { category: "INCOME", isArchived: { not: true } },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Expected Payables ──────────────────────────

export async function getExpectedPayables() {
  return prisma.financialTransaction.findMany({
    where: {
      category: "EXPENSE",
      actualDate: null,
      expectedDate: { not: null },
    },
    orderBy: { expectedDate: "asc" },
  });
}

// ─── Expected Receivables ───────────────────────

export async function getExpectedReceivables() {
  return prisma.financialTransaction.findMany({
    where: {
      category: "INCOME",
      actualDate: null,
      expectedDate: { not: null },
    },
    orderBy: { expectedDate: "asc" },
  });
}

// ─── Archived ────────────────────────────────────

export async function getArchived() {
  return prisma.financialTransaction.findMany({
    where: { isArchived: true },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Summary ─────────────────────────────────────

export async function getSummary(params: SummaryParams) {
  const { dateFrom, dateTo } = params;
  const dateFilter: Prisma.FinancialTransactionWhereInput = dateFrom || dateTo
    ? {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      }
    : {};

  const [income, expense] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { category: "INCOME", ...dateFilter },
      _sum: { amount: true, amountPaid: true, amountLeft: true },
      _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: { category: "EXPENSE", ...dateFilter },
      _sum: { amount: true, amountPaid: true, amountLeft: true },
      _count: true,
    }),
  ]);

  return {
    income: {
      count: income._count,
      totalAmount: income._sum.amount,
      totalPaid: income._sum.amountPaid,
      totalLeft: income._sum.amountLeft,
    },
    expense: {
      count: expense._count,
      totalAmount: expense._sum.amount,
      totalPaid: expense._sum.amountPaid,
      totalLeft: expense._sum.amountLeft,
    },
  };
}
