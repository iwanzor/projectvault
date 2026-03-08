import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listMaterialRequestsSchema,
  createMaterialRequestSchema,
  updateMaterialRequestSchema,
} from "@/lib/validators/material-request";

type ListParams = z.infer<typeof listMaterialRequestsSchema>;
type CreateData = z.infer<typeof createMaterialRequestSchema>;
type UpdateData = z.infer<typeof updateMaterialRequestSchema>;

// ─── List Material Requests ────────────────────────

export async function listMaterialRequests(params: ListParams) {
  const { page, pageSize, search, projectId, mrStatus, sortBy, sortOrder } =
    params;

  const where: Prisma.MaterialRequestMasterWhereInput = {
    ...(projectId ? { projectId } : {}),
    ...(mrStatus ? { mrStatus } : {}),
    ...(search
      ? {
          OR: [
            { materialRequestCode: { contains: search } },
            { description: { contains: search } },
            { project: { projectNo: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.materialRequestMaster.findMany({
      where,
      include: {
        project: {
          select: { id: true, projectNo: true, projectName: true },
        },
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.materialRequestMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ─────────────────────────────────────

export async function getMaterialRequestById(id: number) {
  const mr = await prisma.materialRequestMaster.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, projectNo: true, projectName: true },
      },
      details: true,
    },
  });
  if (!mr) throw new NotFoundError("Material request not found");
  return mr;
}

// ─── Create ────────────────────────────────────────

export async function createMaterialRequest(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const materialRequestCode = await getNextNumber("MR");
  const { items, ...headerData } = data;

  // Verify project exists
  const project = await prisma.projectMaster.findUnique({
    where: { id: headerData.projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  // Calculate total
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += Number(item.quantity) * Number(item.actualCost);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.materialRequestMaster.create({
        data: {
          materialRequestCode,
          branchCode,
          projectId: headerData.projectId,
          description: headerData.description ?? null,
          remarks: headerData.remarks ?? null,
          totalAmount,
          targetLpoDate: headerData.targetLpoDate ?? null,
          supplierCode: headerData.supplierCode ?? null,
          mrStatus: "DRAFT",
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.materialRequestDetail.createMany({
          data: items.map((item) => ({
            materialRequestId: master.id,
            branchCode,
            projectNo: project.projectNo,
            barcode: item.barcode,
            modelNo: item.modelNo,
            itemDescription: item.itemDescription,
            unitCode: item.unitCode,
            quantity: item.quantity,
            landedCostDb: item.landedCostDb ?? 0,
            estimatedLandedCostDb: item.estimatedLandedCostDb ?? 0,
            responseLandedCost: item.responseLandedCost ?? 0,
            currency: item.currency,
            totCostDb: item.totCostDb ?? 0,
            actualCost: item.actualCost ?? 0,
            comment: item.comment ?? null,
            barcodeBudget: item.barcodeBudget ?? null,
            budgetName: item.budgetName ?? null,
            mrDetailType: item.mrDetailType ?? 0,
          })),
        });
      }

      return tx.materialRequestMaster.findUnique({
        where: { id: master.id },
        include: {
          project: {
            select: { id: true, projectNo: true, projectName: true },
          },
          details: true,
        },
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference: check project ID",
          400,
          "INVALID_REFERENCE"
        );
    }
    throw error;
  }
}

// ─── Update ────────────────────────────────────────

export async function updateMaterialRequest(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.materialRequestMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Material request not found");
  if (existing.mrStatus !== "DRAFT") {
    throw new AppError(
      "Only material requests in DRAFT status can be updated",
      400,
      "INVALID_STATUS"
    );
  }

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.materialRequestDetail.deleteMany({
          where: { materialRequestId: id },
        });

        // Get project for projectNo
        const project = await tx.projectMaster.findUnique({
          where: { id: existing.projectId },
        });

        let totalAmount = 0;
        for (const item of items) {
          totalAmount += Number(item.quantity) * Number(item.actualCost);
        }

        if (items.length > 0) {
          await tx.materialRequestDetail.createMany({
            data: items.map((item) => ({
              materialRequestId: id,
              branchCode: existing.branchCode,
              projectNo: project?.projectNo ?? "",
              barcode: item.barcode,
              modelNo: item.modelNo,
              itemDescription: item.itemDescription,
              unitCode: item.unitCode,
              quantity: item.quantity,
              landedCostDb: item.landedCostDb ?? 0,
              estimatedLandedCostDb: item.estimatedLandedCostDb ?? 0,
              responseLandedCost: item.responseLandedCost ?? 0,
              currency: item.currency,
              totCostDb: item.totCostDb ?? 0,
              actualCost: item.actualCost ?? 0,
              comment: item.comment ?? null,
              barcodeBudget: item.barcodeBudget ?? null,
              budgetName: item.budgetName ?? null,
              mrDetailType: item.mrDetailType ?? 0,
            })),
          });
        }

        await tx.materialRequestMaster.update({
          where: { id },
          data: { totalAmount },
        });
      }

      return tx.materialRequestMaster.update({
        where: { id },
        data: {
          ...(headerData.description !== undefined
            ? { description: headerData.description }
            : {}),
          ...(headerData.remarks !== undefined
            ? { remarks: headerData.remarks }
            : {}),
          ...(headerData.targetLpoDate !== undefined
            ? { targetLpoDate: headerData.targetLpoDate }
            : {}),
          ...(headerData.supplierCode !== undefined
            ? { supplierCode: headerData.supplierCode }
            : {}),
          updatedBy: username,
        },
        include: {
          project: {
            select: { id: true, projectNo: true, projectName: true },
          },
          details: true,
        },
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025")
        throw new NotFoundError("Material request not found");
    }
    throw error;
  }
}

// ─── Delete ────────────────────────────────────────

export async function deleteMaterialRequest(id: number) {
  const existing = await prisma.materialRequestMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Material request not found");
  if (existing.mrStatus !== "DRAFT") {
    throw new AppError(
      "Only material requests in DRAFT status can be deleted",
      400,
      "INVALID_STATUS"
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.materialRequestDetail.deleteMany({
      where: { materialRequestId: id },
    });
    return tx.materialRequestMaster.delete({ where: { id } });
  });
}

// ─── Approve / Reject ──────────────────────────────

export async function approveMaterialRequest(
  id: number,
  isApproved: boolean,
  username: string
) {
  const existing = await prisma.materialRequestMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Material request not found");
  if (existing.mrStatus !== "DRAFT") {
    throw new AppError(
      "Only material requests in DRAFT status can be approved/rejected",
      400,
      "INVALID_STATUS"
    );
  }

  return prisma.materialRequestMaster.update({
    where: { id },
    data: {
      isApproved,
      mrStatus: isApproved ? "APPROVED" : "REJECTED",
      updatedBy: username,
    },
    include: {
      project: {
        select: { id: true, projectNo: true, projectName: true },
      },
      details: true,
    },
  });
}
