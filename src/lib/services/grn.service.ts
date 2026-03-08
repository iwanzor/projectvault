import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listGrnsSchema,
  createGrnSchema,
  updateGrnSchema,
} from "@/lib/validators/warehouse";

type ListParams = z.infer<typeof listGrnsSchema>;
type CreateData = z.infer<typeof createGrnSchema>;
type UpdateData = z.infer<typeof updateGrnSchema>;

// ─── List GRNs ────────────────────────────────────

export async function listGrns(params: ListParams) {
  const {
    page,
    pageSize,
    search,
    supplierId,
    purchaseOrderNo,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  } = params;

  const where: Prisma.GrnMasterWhereInput = {
    ...(supplierId ? { supplierId } : {}),
    ...(purchaseOrderNo ? { purchaseOrderNo } : {}),
    ...(dateFrom || dateTo
      ? {
          grnDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { grnNo: { contains: search } },
            { vendorInvoice: { contains: search } },
            { description: { contains: search } },
            { supplier: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.grnMaster.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, supplierCode: true } },
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.grnMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ────────────────────────────────────

export async function getGrnById(id: number) {
  const grn = await prisma.grnMaster.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true, supplierCode: true } },
      details: { orderBy: { serialNo: "asc" } },
    },
  });
  if (!grn) throw new NotFoundError("GRN not found");
  return grn;
}

// ─── Create ───────────────────────────────────────

export async function createGrn(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const grnNo = await getNextNumber("GRN");
  const { items, ...headerData } = data;

  let totalAmount = 0;
  for (const item of items) {
    totalAmount += Number(item.quantity);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.grnMaster.create({
        data: {
          grnNo,
          branchCode,
          grnDate: headerData.grnDate ?? new Date(),
          vendorInvoice: headerData.vendorInvoice,
          supplierId: headerData.supplierId,
          purchaseOrderNo: headerData.purchaseOrderNo,
          description: headerData.description ?? null,
          totalAmount,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.grnDetail.createMany({
          data: items.map((item, index) => ({
            grnMasterId: master.id,
            branchCode,
            serialNo: index + 1,
            barcode: item.barcode,
            purchaseOrderNo: item.purchaseOrderNo,
            projectNo: item.projectNo,
            model: item.model,
            itemDescription: item.itemDescription,
            location: item.location,
            quantity: item.quantity,
            unit: item.unit,
          })),
        });
      }

      return tx.grnMaster.findUnique({
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

export async function updateGrn(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.grnMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GRN not found");

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      let totalUpdate = {};

      if (items !== undefined) {
        await tx.grnDetail.deleteMany({ where: { grnMasterId: id } });

        let totalAmount = 0;
        for (const item of items) {
          totalAmount += Number(item.quantity);
        }
        totalUpdate = { totalAmount };

        if (items.length > 0) {
          await tx.grnDetail.createMany({
            data: items.map((item, index) => ({
              grnMasterId: id,
              branchCode: existing.branchCode,
              serialNo: index + 1,
              barcode: item.barcode,
              purchaseOrderNo: item.purchaseOrderNo,
              projectNo: item.projectNo,
              model: item.model,
              itemDescription: item.itemDescription,
              location: item.location,
              quantity: item.quantity,
              unit: item.unit,
            })),
          });
        }
      }

      return tx.grnMaster.update({
        where: { id },
        data: {
          ...(headerData.grnDate !== undefined
            ? { grnDate: headerData.grnDate }
            : {}),
          ...(headerData.vendorInvoice !== undefined
            ? { vendorInvoice: headerData.vendorInvoice }
            : {}),
          ...(headerData.supplierId !== undefined
            ? { supplierId: headerData.supplierId }
            : {}),
          ...(headerData.purchaseOrderNo !== undefined
            ? { purchaseOrderNo: headerData.purchaseOrderNo }
            : {}),
          ...(headerData.description !== undefined
            ? { description: headerData.description }
            : {}),
          ...totalUpdate,
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
      if (error.code === "P2025") throw new NotFoundError("GRN not found");
    }
    throw error;
  }
}

// ─── Delete ───────────────────────────────────────

export async function deleteGrn(id: number) {
  const existing = await prisma.grnMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GRN not found");

  return prisma.$transaction(async (tx) => {
    await tx.grnDetail.deleteMany({ where: { grnMasterId: id } });
    return tx.grnMaster.delete({ where: { id } });
  });
}
