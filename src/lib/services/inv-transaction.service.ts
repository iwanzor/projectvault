import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listInvTransactionsSchema,
  createInvTransactionSchema,
  updateInvTransactionSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listInvTransactionsSchema>;
type CreateData = z.infer<typeof createInvTransactionSchema>;
type UpdateData = z.infer<typeof updateInvTransactionSchema>;

// ─── List ────────────────────────────────────────

export async function listInvTransactions(params: ListParams) {
  const { page, pageSize, search, projectNo, dateFrom, dateTo, sortBy, sortOrder } = params;

  const where: Prisma.InvTransactionMasterWhereInput = {
    ...(projectNo ? { projectNo } : {}),
    ...(dateFrom || dateTo
      ? {
          transactionDate: {
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
            { supplierCode: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.invTransactionMaster.findMany({
      where,
      include: { _count: { select: { details: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invTransactionMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ───────────────────────────────────

export async function getInvTransactionById(id: number) {
  const txn = await prisma.invTransactionMaster.findUnique({
    where: { id },
    include: { details: { orderBy: { serialNo: "asc" } } },
  });
  if (!txn) throw new NotFoundError("Inventory transaction not found");
  return txn;
}

// ─── Create ──────────────────────────────────────

export async function createInvTransaction(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const transactionNo = await getNextNumber("INV");
  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.invTransactionMaster.create({
        data: {
          transactionNo,
          branchCode,
          nature: headerData.nature,
          transactionDate: headerData.transactionDate ?? new Date(),
          projectNo: headerData.projectNo,
          supplierCode: headerData.supplierCode,
          description: headerData.description ?? null,
          vendorInvoiceNo: headerData.vendorInvoiceNo ?? null,
          requestedBy: headerData.requestedBy ?? null,
          approvedBy: headerData.approvedBy ?? null,
          docFilePath: headerData.docFilePath ?? null,
          toProjectNo: headerData.toProjectNo ?? null,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.invTransactionDetail.createMany({
          data: items.map((item, index) => ({
            transactionId: master.id,
            branchCode,
            nature: item.nature,
            serialNo: index + 1,
            purchaseOrderNo: item.purchaseOrderNo,
            barcode: item.barcode,
            projectNo: item.projectNo,
            itemDescription: item.itemDescription,
            unitCode: item.unitCode,
            locationCode: item.locationCode,
            quantity: item.quantity,
            itemSerialNo: item.itemSerialNo,
            toProjectNo: item.toProjectNo ?? null,
            defFob: item.defFob,
            currency: item.currency,
            totDefFobAmount: item.totDefFobAmount,
            actualFob: item.actualFob,
            actualCurrency: item.actualCurrency,
            totActualFobAmount: item.totActualFobAmount,
            convRate: item.convRate,
            actualFobAed: item.actualFobAed,
            totActualFobAed: item.totActualFobAed,
          })),
        });
      }

      return tx.invTransactionMaster.findUnique({
        where: { id: master.id },
        include: { details: { orderBy: { serialNo: "asc" } } },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Transaction number already exists", 409, "DUPLICATE");
    throw error;
  }
}

// ─── Update ──────────────────────────────────────

export async function updateInvTransaction(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.invTransactionMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Inventory transaction not found");

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.invTransactionDetail.deleteMany({ where: { transactionId: id } });

        if (items.length > 0) {
          await tx.invTransactionDetail.createMany({
            data: items.map((item, index) => ({
              transactionId: id,
              branchCode: existing.branchCode,
              nature: item.nature,
              serialNo: index + 1,
              purchaseOrderNo: item.purchaseOrderNo,
              barcode: item.barcode,
              projectNo: item.projectNo,
              itemDescription: item.itemDescription,
              unitCode: item.unitCode,
              locationCode: item.locationCode,
              quantity: item.quantity,
              itemSerialNo: item.itemSerialNo,
              toProjectNo: item.toProjectNo ?? null,
              defFob: item.defFob,
              currency: item.currency,
              totDefFobAmount: item.totDefFobAmount,
              actualFob: item.actualFob,
              actualCurrency: item.actualCurrency,
              totActualFobAmount: item.totActualFobAmount,
              convRate: item.convRate,
              actualFobAed: item.actualFobAed,
              totActualFobAed: item.totActualFobAed,
            })),
          });
        }
      }

      return tx.invTransactionMaster.update({
        where: { id },
        data: {
          ...(headerData.nature !== undefined ? { nature: headerData.nature } : {}),
          ...(headerData.transactionDate !== undefined ? { transactionDate: headerData.transactionDate } : {}),
          ...(headerData.projectNo !== undefined ? { projectNo: headerData.projectNo } : {}),
          ...(headerData.supplierCode !== undefined ? { supplierCode: headerData.supplierCode } : {}),
          ...(headerData.description !== undefined ? { description: headerData.description } : {}),
          ...(headerData.vendorInvoiceNo !== undefined ? { vendorInvoiceNo: headerData.vendorInvoiceNo } : {}),
          ...(headerData.requestedBy !== undefined ? { requestedBy: headerData.requestedBy } : {}),
          ...(headerData.approvedBy !== undefined ? { approvedBy: headerData.approvedBy } : {}),
          ...(headerData.docFilePath !== undefined ? { docFilePath: headerData.docFilePath } : {}),
          ...(headerData.toProjectNo !== undefined ? { toProjectNo: headerData.toProjectNo } : {}),
          updatedBy: username,
        },
        include: { details: { orderBy: { serialNo: "asc" } } },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Inventory transaction not found");
    throw error;
  }
}

// ─── Delete ──────────────────────────────────────

export async function deleteInvTransaction(id: number) {
  const existing = await prisma.invTransactionMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Inventory transaction not found");

  return prisma.$transaction(async (tx) => {
    await tx.invTransactionDetail.deleteMany({ where: { transactionId: id } });
    return tx.invTransactionMaster.delete({ where: { id } });
  });
}
