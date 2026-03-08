import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listGrrnsSchema,
  createGrrnSchema,
  updateGrrnSchema,
} from "@/lib/validators/warehouse";

type ListParams = z.infer<typeof listGrrnsSchema>;
type CreateData = z.infer<typeof createGrrnSchema>;
type UpdateData = z.infer<typeof updateGrrnSchema>;

// ─── List GRRNs ───────────────────────────────────

export async function listGrrns(params: ListParams) {
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

  const where: Prisma.GrrnMasterWhereInput = {
    ...(projectNo ? { projectNo } : {}),
    ...(dateFrom || dateTo
      ? {
          grrnDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { grrnNo: { contains: search } },
            { description: { contains: search } },
            { projectNo: { contains: search } },
            { returnedBy: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.grrnMaster.findMany({
      where,
      include: {
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.grrnMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ────────────────────────────────────

export async function getGrrnById(id: number) {
  const grrn = await prisma.grrnMaster.findUnique({
    where: { id },
    include: {
      details: { orderBy: { serialNo: "asc" } },
    },
  });
  if (!grrn) throw new NotFoundError("GRRN not found");
  return grrn;
}

// ─── Create ───────────────────────────────────────

export async function createGrrn(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const grrnNo = await getNextNumber("GRRN");
  const { items, ...headerData } = data;

  let totalAmount = 0;
  for (const item of items) {
    totalAmount += Number(item.quantity);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.grrnMaster.create({
        data: {
          grrnNo,
          branchCode,
          grrnDate: headerData.grrnDate ?? new Date(),
          returnedBy: headerData.returnedBy,
          projectNo: headerData.projectNo,
          description: headerData.description ?? null,
          totalAmount,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.grrnDetail.createMany({
          data: items.map((item, index) => ({
            grrnMasterId: master.id,
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

      return tx.grrnMaster.findUnique({
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

export async function updateGrrn(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.grrnMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GRRN not found");

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      let totalUpdate = {};

      if (items !== undefined) {
        await tx.grrnDetail.deleteMany({ where: { grrnMasterId: id } });

        let totalAmount = 0;
        for (const item of items) {
          totalAmount += Number(item.quantity);
        }
        totalUpdate = { totalAmount };

        if (items.length > 0) {
          await tx.grrnDetail.createMany({
            data: items.map((item, index) => ({
              grrnMasterId: id,
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

      return tx.grrnMaster.update({
        where: { id },
        data: {
          ...(headerData.grrnDate !== undefined
            ? { grrnDate: headerData.grrnDate }
            : {}),
          ...(headerData.returnedBy !== undefined
            ? { returnedBy: headerData.returnedBy }
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
      if (error.code === "P2025") throw new NotFoundError("GRRN not found");
    }
    throw error;
  }
}

// ─── Delete ───────────────────────────────────────

export async function deleteGrrn(id: number) {
  const existing = await prisma.grrnMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("GRRN not found");

  return prisma.$transaction(async (tx) => {
    await tx.grrnDetail.deleteMany({ where: { grrnMasterId: id } });
    return tx.grrnMaster.delete({ where: { id } });
  });
}
