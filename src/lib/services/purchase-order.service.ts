import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listPurchaseOrdersSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from "@/lib/validators/warehouse";

type ListParams = z.infer<typeof listPurchaseOrdersSchema>;
type CreateData = z.infer<typeof createPurchaseOrderSchema>;
type UpdateData = z.infer<typeof updatePurchaseOrderSchema>;

// ─── List Purchase Orders ─────────────────────────

export async function listPurchaseOrders(params: ListParams) {
  const {
    page,
    pageSize,
    search,
    status,
    supplierId,
    projectNo,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  } = params;

  const where: Prisma.PurchaseOrderMasterWhereInput = {
    ...(status ? { status } : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(projectNo ? { projectNo } : {}),
    ...(dateFrom || dateTo
      ? {
          purchaseOrderDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { purchaseOrderNo: { contains: search } },
            { description: { contains: search } },
            { projectNo: { contains: search } },
            { supplier: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.purchaseOrderMaster.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, supplierCode: true } },
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.purchaseOrderMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ────────────────────────────────────

export async function getPurchaseOrderById(id: number) {
  const po = await prisma.purchaseOrderMaster.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true, supplierCode: true } },
      details: { orderBy: { serialNo: "asc" } },
    },
  });
  if (!po) throw new NotFoundError("Purchase order not found");
  return po;
}

// ─── Create ───────────────────────────────────────

export async function createPurchaseOrder(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const purchaseOrderNo = await getNextNumber("PO");
  const { items, ...headerData } = data;

  // Calculate totals
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += Number(item.totActualFobAed);
  }
  const discountAmt =
    headerData.discountAmount ||
    totalAmount * (Number(headerData.discountPercentage) / 100);
  const netAmount = totalAmount - discountAmt + Number(headerData.freightCharges) + Number(headerData.miscCharges);
  const vatAmount = netAmount * (Number(headerData.vatPerc) / 100);
  const grossTotal = netAmount + vatAmount;

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.purchaseOrderMaster.create({
        data: {
          purchaseOrderNo,
          branchCode,
          purchaseOrderDate: headerData.purchaseOrderDate ?? new Date(),
          supplierId: headerData.supplierId,
          projectNo: headerData.projectNo,
          description: headerData.description ?? null,
          status: "DRAFT",
          totalAmount,
          discountPercentage: headerData.discountPercentage ?? 0,
          discountAmount: discountAmt,
          freightCharges: headerData.freightCharges ?? 0,
          miscCharges: headerData.miscCharges ?? 0,
          netAmount,
          vatPerc: headerData.vatPerc ?? 0,
          vatAmount,
          grossTotal,
          shipTo: headerData.shipTo ?? null,
          estArrivalDays: headerData.estArrivalDays ?? null,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.purchaseOrderDetail.createMany({
          data: items.map((item, index) => ({
            purchaseOrderId: master.id,
            branchCode,
            serialNo: index + 1,
            barcode: item.barcode,
            unitCode: item.unitCode,
            itemDescription: item.itemDescription ?? null,
            quantity: item.quantity,
            defFob: item.defFob ?? 0,
            currency: item.currency,
            totDefFobAmount: item.totDefFobAmount ?? 0,
            actualFob: item.actualFob ?? 0,
            actualCurrency: item.actualCurrency,
            totActualFobAmount: item.totActualFobAmount ?? 0,
            convRate: item.convRate ?? 1,
            actualFobAed: item.actualFobAed ?? 0,
            totActualFobAed: item.totActualFobAed ?? 0,
            vatPerc: item.vatPerc ?? 0,
            vatAmount: item.vatAmount ?? 0,
          })),
        });
      }

      return tx.purchaseOrderMaster.findUnique({
        where: { id: master.id },
        include: {
          supplier: { select: { id: true, name: true, supplierCode: true } },
          details: { orderBy: { serialNo: "asc" } },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference: check supplier ID",
          400,
          "INVALID_REFERENCE"
        );
    }
    throw error;
  }
}

// ─── Update ───────────────────────────────────────

export async function updatePurchaseOrder(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.purchaseOrderMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Purchase order not found");
  if (existing.status !== "DRAFT") {
    throw new AppError(
      "Only purchase orders in DRAFT status can be updated",
      400,
      "INVALID_STATUS"
    );
  }

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      let totalsUpdate = {};

      if (items !== undefined) {
        await tx.purchaseOrderDetail.deleteMany({
          where: { purchaseOrderId: id },
        });

        let totalAmount = 0;
        for (const item of items) {
          totalAmount += Number(item.totActualFobAed);
        }

        const discPct =
          headerData.discountPercentage ?? Number(existing.discountPercentage);
        const discAmt =
          headerData.discountAmount ??
          totalAmount * (discPct / 100);
        const freight =
          headerData.freightCharges ?? Number(existing.freightCharges);
        const misc = headerData.miscCharges ?? Number(existing.miscCharges);
        const netAmount = totalAmount - discAmt + freight + misc;
        const vatP = headerData.vatPerc ?? Number(existing.vatPerc);
        const vatAmount = netAmount * (vatP / 100);
        const grossTotal = netAmount + vatAmount;

        totalsUpdate = {
          totalAmount,
          discountPercentage: discPct,
          discountAmount: discAmt,
          freightCharges: freight,
          miscCharges: misc,
          netAmount,
          vatPerc: vatP,
          vatAmount,
          grossTotal,
        };

        if (items.length > 0) {
          await tx.purchaseOrderDetail.createMany({
            data: items.map((item, index) => ({
              purchaseOrderId: id,
              branchCode: existing.branchCode,
              serialNo: index + 1,
              barcode: item.barcode,
              unitCode: item.unitCode,
              itemDescription: item.itemDescription ?? null,
              quantity: item.quantity,
              defFob: item.defFob ?? 0,
              currency: item.currency,
              totDefFobAmount: item.totDefFobAmount ?? 0,
              actualFob: item.actualFob ?? 0,
              actualCurrency: item.actualCurrency,
              totActualFobAmount: item.totActualFobAmount ?? 0,
              convRate: item.convRate ?? 1,
              actualFobAed: item.actualFobAed ?? 0,
              totActualFobAed: item.totActualFobAed ?? 0,
              vatPerc: item.vatPerc ?? 0,
              vatAmount: item.vatAmount ?? 0,
            })),
          });
        }
      }

      return tx.purchaseOrderMaster.update({
        where: { id },
        data: {
          ...(headerData.purchaseOrderDate !== undefined
            ? { purchaseOrderDate: headerData.purchaseOrderDate }
            : {}),
          ...(headerData.supplierId !== undefined
            ? { supplierId: headerData.supplierId }
            : {}),
          ...(headerData.projectNo !== undefined
            ? { projectNo: headerData.projectNo }
            : {}),
          ...(headerData.description !== undefined
            ? { description: headerData.description }
            : {}),
          ...(headerData.shipTo !== undefined
            ? { shipTo: headerData.shipTo }
            : {}),
          ...(headerData.estArrivalDays !== undefined
            ? { estArrivalDays: headerData.estArrivalDays }
            : {}),
          ...totalsUpdate,
          updatedBy: username,
        },
        include: {
          supplier: { select: { id: true, name: true, supplierCode: true } },
          details: { orderBy: { serialNo: "asc" } },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference: check supplier ID",
          400,
          "INVALID_REFERENCE"
        );
      if (error.code === "P2025")
        throw new NotFoundError("Purchase order not found");
    }
    throw error;
  }
}

// ─── Delete ───────────────────────────────────────

export async function deletePurchaseOrder(id: number) {
  const existing = await prisma.purchaseOrderMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Purchase order not found");
  if (existing.status !== "DRAFT") {
    throw new AppError(
      "Only purchase orders in DRAFT status can be deleted",
      400,
      "INVALID_STATUS"
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.purchaseOrderDetail.deleteMany({
      where: { purchaseOrderId: id },
    });
    return tx.purchaseOrderMaster.delete({ where: { id } });
  });
}

// ─── Approve ──────────────────────────────────────

export async function approvePurchaseOrder(id: number, username: string) {
  const existing = await prisma.purchaseOrderMaster.findUnique({
    where: { id },
    include: { _count: { select: { details: true } } },
  });
  if (!existing) throw new NotFoundError("Purchase order not found");
  if (existing.status !== "DRAFT") {
    throw new AppError(
      "Only purchase orders in DRAFT status can be approved",
      400,
      "INVALID_STATUS"
    );
  }
  if (existing._count.details === 0) {
    throw new AppError(
      "Purchase order must have at least one line item before approving",
      400,
      "NO_LINE_ITEMS"
    );
  }

  return prisma.purchaseOrderMaster.update({
    where: { id },
    data: {
      status: "APPROVED",
      updatedBy: username,
    },
  });
}

// ─── Receive ──────────────────────────────────────

export async function receivePurchaseOrder(id: number, username: string) {
  const existing = await prisma.purchaseOrderMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Purchase order not found");
  if (existing.status !== "APPROVED") {
    throw new AppError(
      "Only purchase orders in APPROVED status can be received",
      400,
      "INVALID_STATUS"
    );
  }

  return prisma.purchaseOrderMaster.update({
    where: { id },
    data: {
      status: "RECEIVED",
      updatedBy: username,
    },
  });
}

// ─── Cancel ───────────────────────────────────────

export async function cancelPurchaseOrder(id: number, username: string) {
  const existing = await prisma.purchaseOrderMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Purchase order not found");
  if (existing.status === "CANCELLED") {
    throw new AppError(
      "Purchase order is already cancelled",
      400,
      "INVALID_STATUS"
    );
  }

  return prisma.purchaseOrderMaster.update({
    where: { id },
    data: {
      status: "CANCELLED",
      updatedBy: username,
    },
  });
}
