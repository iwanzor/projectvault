import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listGtnsSchema,
  createGtnSchema,
  updateGtnSchema,
} from "@/lib/validators/warehouse";

type ListParams = z.infer<typeof listGtnsSchema>;
type CreateData = z.infer<typeof createGtnSchema>;
type UpdateData = z.infer<typeof updateGtnSchema>;

// ─── List GTNs ────────────────────────────────────

export async function listGtns(params: ListParams) {
  const {
    page,
    pageSize,
    search,
    fromProjectNo,
    toProjectNo,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  } = params;

  const where: Prisma.GtnMasterWhereInput = {
    ...(fromProjectNo ? { fromProjectNo } : {}),
    ...(toProjectNo ? { toProjectNo } : {}),
    ...(dateFrom || dateTo
      ? {
          gtnDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { gtnNo: { contains: search } },
            { description: { contains: search } },
            { fromProjectNo: { contains: search } },
            { toProjectNo: { contains: search } },
            { requestedBy: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.gtnMaster.findMany({
      where,
      include: {
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.gtnMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ────────────────────────────────────

export async function getGtnById(id: number) {
  const gtn = await prisma.gtnMaster.findUnique({
    where: { id },
    include: {
      details: { orderBy: { serialNo: "asc" } },
    },
  });
  if (!gtn) throw new NotFoundError("GTN not found");
  return gtn;
}

// ─── Create ───────────────────────────────────────

export async function createGtn(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const gtnNo = await getNextNumber("GTN");
  const { items, ...headerData } = data;

  let totalAmount = 0;
  for (const item of items) {
    totalAmount += Number(item.quantity);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.gtnMaster.create({
        data: {
          gtnNo,
          branchCode,
          gtnDate: headerData.gtnDate ?? new Date(),
          requestedBy: headerData.requestedBy,
          approvedBy: headerData.approvedBy,
          fromProjectNo: headerData.fromProjectNo,
          toProjectNo: headerData.toProjectNo,
          description: headerData.description ?? null,
          totalAmount,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.gtnDetail.createMany({
          data: items.map((item, index) => ({
            gtnMasterId: master.id,
            branchCode,
            serialNo: index + 1,
            barcode: item.barcode,
            model: item.model,
            itemDescription: item.itemDescription,
            location: item.location,
            quantity: item.quantity,
            unit: item.unit,
          })),
        });
      }

      return tx.gtnMaster.findUnique({
        where: { id: master.id },
        include: {
          details: { orderBy: { serialNo: "asc" } },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference",
          400,
          "INVALID_REFERENCE"
        );
    }
    throw error;
  }
}

// ─── Update ───────────────────────────────────────

export async function updateGtn(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.gtnMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GTN not found");

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      let totalUpdate = {};

      if (items !== undefined) {
        await tx.gtnDetail.deleteMany({ where: { gtnMasterId: id } });

        let totalAmount = 0;
        for (const item of items) {
          totalAmount += Number(item.quantity);
        }
        totalUpdate = { totalAmount };

        if (items.length > 0) {
          await tx.gtnDetail.createMany({
            data: items.map((item, index) => ({
              gtnMasterId: id,
              branchCode: existing.branchCode,
              serialNo: index + 1,
              barcode: item.barcode,
              model: item.model,
              itemDescription: item.itemDescription,
              location: item.location,
              quantity: item.quantity,
              unit: item.unit,
            })),
          });
        }
      }

      return tx.gtnMaster.update({
        where: { id },
        data: {
          ...(headerData.gtnDate !== undefined
            ? { gtnDate: headerData.gtnDate }
            : {}),
          ...(headerData.requestedBy !== undefined
            ? { requestedBy: headerData.requestedBy }
            : {}),
          ...(headerData.approvedBy !== undefined
            ? { approvedBy: headerData.approvedBy }
            : {}),
          ...(headerData.fromProjectNo !== undefined
            ? { fromProjectNo: headerData.fromProjectNo }
            : {}),
          ...(headerData.toProjectNo !== undefined
            ? { toProjectNo: headerData.toProjectNo }
            : {}),
          ...(headerData.description !== undefined
            ? { description: headerData.description }
            : {}),
          ...totalUpdate,
          updatedBy: username,
        },
        include: {
          details: { orderBy: { serialNo: "asc" } },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("GTN not found");
    }
    throw error;
  }
}

// ─── Delete ───────────────────────────────────────

export async function deleteGtn(id: number) {
  const existing = await prisma.gtnMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GTN not found");

  return prisma.$transaction(async (tx) => {
    await tx.gtnDetail.deleteMany({ where: { gtnMasterId: id } });
    return tx.gtnMaster.delete({ where: { id } });
  });
}
