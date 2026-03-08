import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listGinsSchema,
  createGinSchema,
  updateGinSchema,
} from "@/lib/validators/warehouse";

type ListParams = z.infer<typeof listGinsSchema>;
type CreateData = z.infer<typeof createGinSchema>;
type UpdateData = z.infer<typeof updateGinSchema>;

// ─── List GINs ────────────────────────────────────

export async function listGins(params: ListParams) {
  const {
    page,
    pageSize,
    search,
    projectNo,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  } = params;

  const where: Prisma.GinMasterWhereInput = {
    ...(projectNo ? { projectNo } : {}),
    ...(dateFrom || dateTo
      ? {
          ginDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { ginNo: { contains: search } },
            { description: { contains: search } },
            { projectNo: { contains: search } },
            { requestedBy: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ginMaster.findMany({
      where,
      include: {
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ginMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ────────────────────────────────────

export async function getGinById(id: number) {
  const gin = await prisma.ginMaster.findUnique({
    where: { id },
    include: {
      details: { orderBy: { serialNo: "asc" } },
    },
  });
  if (!gin) throw new NotFoundError("GIN not found");
  return gin;
}

// ─── Create ───────────────────────────────────────

export async function createGin(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const ginNo = await getNextNumber("GIN");
  const { items, ...headerData } = data;

  let totalAmount = 0;
  for (const item of items) {
    totalAmount += Number(item.quantity);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.ginMaster.create({
        data: {
          ginNo,
          branchCode,
          ginDate: headerData.ginDate ?? new Date(),
          requestedBy: headerData.requestedBy,
          projectNo: headerData.projectNo,
          description: headerData.description ?? null,
          totalAmount,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.ginDetail.createMany({
          data: items.map((item, index) => ({
            ginMasterId: master.id,
            branchCode,
            serialNo: index + 1,
            barcode: item.barcode,
            projectNo: item.projectNo,
            model: item.model,
            itemDescription: item.itemDescription,
            location: item.location,
            quantity: item.quantity,
            unit: item.unit,
          })),
        });
      }

      return tx.ginMaster.findUnique({
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

export async function updateGin(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.ginMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GIN not found");

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      let totalUpdate = {};

      if (items !== undefined) {
        await tx.ginDetail.deleteMany({ where: { ginMasterId: id } });

        let totalAmount = 0;
        for (const item of items) {
          totalAmount += Number(item.quantity);
        }
        totalUpdate = { totalAmount };

        if (items.length > 0) {
          await tx.ginDetail.createMany({
            data: items.map((item, index) => ({
              ginMasterId: id,
              branchCode: existing.branchCode,
              serialNo: index + 1,
              barcode: item.barcode,
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

      return tx.ginMaster.update({
        where: { id },
        data: {
          ...(headerData.ginDate !== undefined
            ? { ginDate: headerData.ginDate }
            : {}),
          ...(headerData.requestedBy !== undefined
            ? { requestedBy: headerData.requestedBy }
            : {}),
          ...(headerData.projectNo !== undefined
            ? { projectNo: headerData.projectNo }
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
      if (error.code === "P2025") throw new NotFoundError("GIN not found");
    }
    throw error;
  }
}

// ─── Delete ───────────────────────────────────────

export async function deleteGin(id: number) {
  const existing = await prisma.ginMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GIN not found");

  return prisma.$transaction(async (tx) => {
    await tx.ginDetail.deleteMany({ where: { ginMasterId: id } });
    return tx.ginMaster.delete({ where: { id } });
  });
}
