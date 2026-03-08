import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listPhysicalStocksSchema,
  createPhysicalStockSchema,
  updatePhysicalStockSchema,
} from "@/lib/validators/warehouse";

type ListParams = z.infer<typeof listPhysicalStocksSchema>;
type CreateData = z.infer<typeof createPhysicalStockSchema>;
type UpdateData = z.infer<typeof updatePhysicalStockSchema>;

// ─── List Physical Stock ──────────────────────────

export async function listPhysicalStocks(params: ListParams) {
  const {
    page,
    pageSize,
    search,
    projectNo,
    barcode,
    psStatus,
    psState,
    isAccessories,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  } = params;

  const where: Prisma.PhysicalStockWhereInput = {
    ...(projectNo ? { projectNo } : {}),
    ...(barcode ? { barcode } : {}),
    ...(psStatus ? { psStatus } : {}),
    ...(psState ? { psState } : {}),
    ...(isAccessories !== undefined ? { isAccessories } : {}),
    ...(dateFrom || dateTo
      ? {
          docDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { docNo: { contains: search } },
            { barcode: { contains: search } },
            { projectNo: { contains: search } },
            { serialNo: { contains: search } },
            { location: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.physicalStock.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.physicalStock.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ────────────────────────────────────

export async function getPhysicalStockById(id: number) {
  const stock = await prisma.physicalStock.findUnique({ where: { id } });
  if (!stock) throw new NotFoundError("Physical stock record not found");
  return stock;
}

// ─── Create ───────────────────────────────────────

export async function createPhysicalStock(
  data: CreateData,
  username: string,
  branchCode: string
) {
  return prisma.physicalStock.create({
    data: {
      branchCode,
      docNo: data.docNo,
      docDate: data.docDate ?? new Date(),
      projectNo: data.projectNo,
      barcode: data.barcode,
      location: data.location,
      serialNo: data.serialNo,
      quantity: data.quantity,
      psStatus: data.psStatus,
      psState: data.psState,
      autoGenerate: data.autoGenerate,
      defFob: data.defFob ?? 0,
      defCur: data.defCur,
      totDefFobAmount: data.totDefFobAmount ?? 0,
      convRate: data.convRate ?? 1,
      fobPriceAed: data.fobPriceAed ?? 0,
      totFobPriceAed: data.totFobPriceAed ?? 0,
      isAccessories: data.isAccessories ?? null,
      landedCost: data.landedCost ?? null,
      createdBy: username,
      updatedBy: username,
    },
  });
}

// ─── Update ───────────────────────────────────────

export async function updatePhysicalStock(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.physicalStock.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Physical stock record not found");

  try {
    return await prisma.physicalStock.update({
      where: { id },
      data: {
        ...(data.docNo !== undefined ? { docNo: data.docNo } : {}),
        ...(data.docDate !== undefined ? { docDate: data.docDate } : {}),
        ...(data.projectNo !== undefined ? { projectNo: data.projectNo } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.serialNo !== undefined ? { serialNo: data.serialNo } : {}),
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.psStatus !== undefined ? { psStatus: data.psStatus } : {}),
        ...(data.psState !== undefined ? { psState: data.psState } : {}),
        ...(data.autoGenerate !== undefined
          ? { autoGenerate: data.autoGenerate }
          : {}),
        ...(data.defFob !== undefined ? { defFob: data.defFob } : {}),
        ...(data.defCur !== undefined ? { defCur: data.defCur } : {}),
        ...(data.totDefFobAmount !== undefined
          ? { totDefFobAmount: data.totDefFobAmount }
          : {}),
        ...(data.convRate !== undefined ? { convRate: data.convRate } : {}),
        ...(data.fobPriceAed !== undefined
          ? { fobPriceAed: data.fobPriceAed }
          : {}),
        ...(data.totFobPriceAed !== undefined
          ? { totFobPriceAed: data.totFobPriceAed }
          : {}),
        ...(data.isAccessories !== undefined
          ? { isAccessories: data.isAccessories }
          : {}),
        ...(data.landedCost !== undefined
          ? { landedCost: data.landedCost }
          : {}),
        updatedBy: username,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025")
        throw new NotFoundError("Physical stock record not found");
    }
    throw error;
  }
}

// ─── Delete ───────────────────────────────────────

export async function deletePhysicalStock(id: number) {
  const existing = await prisma.physicalStock.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Physical stock record not found");

  return prisma.physicalStock.delete({ where: { id } });
}

// ─── Stock Summary ────────────────────────────────

export async function getStockSummary() {
  const summary = await prisma.physicalStock.groupBy({
    by: ["barcode", "projectNo"],
    _sum: {
      quantity: true,
      totFobPriceAed: true,
    },
    _count: {
      id: true,
    },
  });

  return summary;
}

// ─── Accessories Stock ────────────────────────────

export async function getAccessoriesStock() {
  return prisma.physicalStock.findMany({
    where: { isAccessories: true },
    orderBy: { createdAt: "desc" },
  });
}
