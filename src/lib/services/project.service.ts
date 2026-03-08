import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import type { z } from "zod/v4";
import type {
  listProjectsSchema,
  createProjectSchema,
  updateProjectSchema,
  updateStatusSchema,
  addProjectRoleSchema,
  addProjectRemarkSchema,
  updateProjectRemarkSchema,
  addDocumentDetailSchema,
  updateDocumentDetailSchema,
  addCumulativeLpoSchema,
  updateCumulativeLpoSchema,
} from "@/lib/validators/project";

type ListParams = z.infer<typeof listProjectsSchema>;
type CreateData = z.infer<typeof createProjectSchema>;
type UpdateData = z.infer<typeof updateProjectSchema>;
type StatusData = z.infer<typeof updateStatusSchema>;
type RoleData = z.infer<typeof addProjectRoleSchema>;
type RemarkData = z.infer<typeof addProjectRemarkSchema>;
type RemarkUpdateData = z.infer<typeof updateProjectRemarkSchema>;
type DocumentData = z.infer<typeof addDocumentDetailSchema>;
type DocumentUpdateData = z.infer<typeof updateDocumentDetailSchema>;
type LpoData = z.infer<typeof addCumulativeLpoSchema>;
type LpoUpdateData = z.infer<typeof updateCumulativeLpoSchema>;

// ─── List Projects ─────────────────────────────────

export async function listProjects(params: ListParams) {
  const {
    page,
    pageSize,
    search,
    status,
    customerId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  } = params;

  const where: Prisma.ProjectMasterWhereInput = {
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
    ...(dateFrom || dateTo
      ? {
          projectDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { projectNo: { contains: search } },
            { projectName: { contains: search } },
            { customer: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.projectMaster.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        _count: { select: { details: true, roles: true, materialRequests: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.projectMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ─────────────────────────────────────

export async function getProjectById(id: number) {
  const project = await prisma.projectMaster.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, customerCode: true } },
      quotation: { select: { id: true, quotationNo: true } },
      details: { orderBy: { serialNo: "asc" } },
      roles: {
        include: {
          user: { select: { id: true, userCode: true, username: true } },
        },
      },
      remarks_list: { orderBy: { serialNo: "asc" } },
      boqFilePaths: { orderBy: { serialNo: "asc" } },
      documentDetails: {
        include: {
          document: { select: { id: true, documentCode: true, description: true } },
        },
        orderBy: { serialNo: "asc" },
      },
      ginDetails: { orderBy: { serialNo: "asc" } },
      cumulativeLpoDates: true,
      materialRequests: {
        include: { _count: { select: { details: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

// ─── Create ────────────────────────────────────────

export async function createProject(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const projectNo = await getNextNumber("PJ");
  const { items, quotationId, ...headerData } = data;

  // Calculate totals from items
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += item.quantity * item.rate;
  }
  const discountPerc = headerData.discountPercentage ?? 0;
  const discountAmt = headerData.discountAmount ?? 0;
  const netAmount = totalAmount - discountAmt - (totalAmount * discountPerc) / 100;
  const vatPerc = headerData.vatPerc ?? 0;
  const vatAmount = (netAmount * vatPerc) / 100;
  const grossTotal = netAmount + vatAmount;

  try {
    return await prisma.$transaction(async (tx) => {
      // If converting from quotation, load quotation details
      let quotationItems: Prisma.ProjectDetailCreateManyInput[] = [];
      let quotationNo = "";

      if (quotationId) {
        const quotation = await tx.salesQuotationMaster.findUnique({
          where: { id: quotationId },
          include: { details: { orderBy: { serialNo: "asc" } } },
        });
        if (!quotation) throw new NotFoundError("Quotation not found");
        if (quotation.usedInProject) {
          throw new AppError(
            "Quotation has already been used in a project",
            400,
            "QUOTATION_ALREADY_USED"
          );
        }

        quotationNo = quotation.quotationNo;

        // Copy quotation line items to project details
        quotationItems = quotation.details.map((d, index) => ({
          projectId: 0, // will be set after master creation
          branchCode: d.branchCode,
          quotationNo: quotation.quotationNo,
          barcode: d.barcode,
          serialNo: index + 1,
          model: d.model,
          itemDescription: d.itemDescription,
          location: d.location ?? "",
          mainLocation: d.mainLocation,
          fobPrice: d.fobPrice,
          landedCost: d.landedCost,
          quantity: d.quantity,
          rate: d.rate,
          amount: d.amount,
          brandDesc: d.brandDesc,
          estShipPara: d.estShipPara,
          estAmount: d.estAmount,
          estFobPrice: d.estFobPrice,
          estLandedCost: d.estLandedCost,
          estUnitPrice: d.estUnitPrice,
          estDefFob: d.estDefFob,
          estMarkup: d.estMarkup,
          estCustPara: d.estCustPara,
          exchangeRate: d.exchangeRate,
          vatPerc: 0,
          vatAmount: d.vatAmount,
        }));

        // Recalculate totals from quotation
        totalAmount = Number(quotation.totalAmount);
        const qNetAmount = Number(quotation.netAmount);
        const qVatAmount = Number(quotation.vatAmount);
        const qGrossTotal = Number(quotation.grossTotal);

        // Mark quotation as used
        await tx.salesQuotationMaster.update({
          where: { id: quotationId },
          data: { usedInProject: true, status: "PROJECT" },
        });

        // Create master with quotation totals
        const master = await tx.projectMaster.create({
          data: {
            projectNo,
            branchCode,
            projectDate: headerData.projectDate ?? new Date(),
            customerId: headerData.customerId,
            quotationId,
            projectName: headerData.projectName,
            projectTags: headerData.projectTags ?? null,
            description: headerData.description ?? null,
            remarks: headerData.remarks ?? null,
            assignPmCode: headerData.assignPmCode ?? null,
            assignTlCode: headerData.assignTlCode ?? null,
            handoverDate: headerData.handoverDate ?? null,
            commissionDate: headerData.commissionDate ?? null,
            programDate: headerData.programDate ?? null,
            targetLpoDate: headerData.targetLpoDate ?? null,
            targetShipmentDate: headerData.targetShipmentDate ?? null,
            deliverySiteDate: headerData.deliverySiteDate ?? null,
            installationDate: headerData.installationDate ?? null,
            totalAmount: quotation.totalAmount,
            discountPercentage: quotation.discountPercentage,
            discountAmount: quotation.discountAmount,
            netAmount: qNetAmount,
            vatPerc: Number(quotation.vatPerc),
            vatAmount: qVatAmount,
            grossTotal: qGrossTotal,
            createdBy: username,
            updatedBy: username,
          },
        });

        if (quotationItems.length > 0) {
          await tx.projectDetail.createMany({
            data: quotationItems.map((item) => ({
              ...item,
              projectId: master.id,
            })),
          });
        }

        return tx.projectMaster.findUnique({
          where: { id: master.id },
          include: {
            customer: { select: { id: true, name: true, customerCode: true } },
            details: { orderBy: { serialNo: "asc" } },
          },
        });
      }

      // Create without quotation
      const master = await tx.projectMaster.create({
        data: {
          projectNo,
          branchCode,
          projectDate: headerData.projectDate ?? new Date(),
          customerId: headerData.customerId,
          projectName: headerData.projectName,
          projectTags: headerData.projectTags ?? null,
          description: headerData.description ?? null,
          remarks: headerData.remarks ?? null,
          assignPmCode: headerData.assignPmCode ?? null,
          assignTlCode: headerData.assignTlCode ?? null,
          handoverDate: headerData.handoverDate ?? null,
          commissionDate: headerData.commissionDate ?? null,
          programDate: headerData.programDate ?? null,
          targetLpoDate: headerData.targetLpoDate ?? null,
          targetShipmentDate: headerData.targetShipmentDate ?? null,
          deliverySiteDate: headerData.deliverySiteDate ?? null,
          installationDate: headerData.installationDate ?? null,
          totalAmount,
          discountPercentage: discountPerc,
          discountAmount: discountAmt,
          netAmount,
          vatPerc,
          vatAmount,
          grossTotal,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (items.length > 0) {
        await tx.projectDetail.createMany({
          data: items.map((item, index) => ({
            projectId: master.id,
            branchCode,
            quotationNo: "",
            barcode: item.barcode,
            serialNo: index + 1,
            model: item.model,
            itemDescription: item.itemDescription,
            location: item.location ?? "",
            mainLocation: item.mainLocation ?? null,
            fobPrice: item.fobPrice ?? 0,
            landedCost: item.landedCost ?? 0,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
            brandDesc: item.brandDesc ?? null,
            estShipPara: item.estShipPara ?? 0,
            estAmount: item.estAmount ?? 0,
            estFobPrice: item.estFobPrice ?? 0,
            estLandedCost: item.estLandedCost ?? 0,
            estUnitPrice: item.estUnitPrice ?? 0,
            estDefFob: item.estDefFob ?? null,
            estMarkup: item.estMarkup ?? null,
            estCustPara: item.estCustPara ?? null,
            exchangeRate: item.exchangeRate ?? null,
            vatPerc: item.vatPerc ?? 0,
            vatAmount: item.vatAmount ?? 0,
            rowColor: item.rowColor ?? null,
          })),
        });
      }

      return tx.projectMaster.findUnique({
        where: { id: master.id },
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          details: { orderBy: { serialNo: "asc" } },
        },
      });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference: check customer ID",
          400,
          "INVALID_REFERENCE"
        );
    }
    throw error;
  }
}

// ─── Update ────────────────────────────────────────

export async function updateProject(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.projectMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Project not found");
  if (existing.status !== "ACTIVE" && existing.status !== "ON_HOLD") {
    throw new AppError(
      "Only projects in ACTIVE or ON_HOLD status can be updated",
      400,
      "INVALID_STATUS"
    );
  }

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      let totalsUpdate = {};

      if (items !== undefined) {
        await tx.projectDetail.deleteMany({ where: { projectId: id } });

        let totalAmount = 0;
        for (const item of items) {
          totalAmount += item.quantity * item.rate;
        }
        const discountPerc =
          headerData.discountPercentage ?? Number(existing.discountPercentage);
        const discountAmt =
          headerData.discountAmount ?? Number(existing.discountAmount);
        const netAmount =
          totalAmount - discountAmt - (totalAmount * discountPerc) / 100;
        const vatPerc = headerData.vatPerc ?? Number(existing.vatPerc);
        const vatAmount = (netAmount * vatPerc) / 100;
        const grossTotal = netAmount + vatAmount;

        totalsUpdate = {
          totalAmount,
          netAmount,
          vatAmount,
          grossTotal,
        };

        if (items.length > 0) {
          await tx.projectDetail.createMany({
            data: items.map((item, index) => ({
              projectId: id,
              branchCode: existing.branchCode,
              quotationNo: "",
              barcode: item.barcode,
              serialNo: index + 1,
              model: item.model,
              itemDescription: item.itemDescription,
              location: item.location ?? "",
              mainLocation: item.mainLocation ?? null,
              fobPrice: item.fobPrice ?? 0,
              landedCost: item.landedCost ?? 0,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.quantity * item.rate,
              brandDesc: item.brandDesc ?? null,
              estShipPara: item.estShipPara ?? 0,
              estAmount: item.estAmount ?? 0,
              estFobPrice: item.estFobPrice ?? 0,
              estLandedCost: item.estLandedCost ?? 0,
              estUnitPrice: item.estUnitPrice ?? 0,
              estDefFob: item.estDefFob ?? null,
              estMarkup: item.estMarkup ?? null,
              estCustPara: item.estCustPara ?? null,
              exchangeRate: item.exchangeRate ?? null,
              vatPerc: item.vatPerc ?? 0,
              vatAmount: item.vatAmount ?? 0,
              rowColor: item.rowColor ?? null,
            })),
          });
        }
      }

      const updated = await tx.projectMaster.update({
        where: { id },
        data: {
          ...(headerData.customerId !== undefined
            ? { customerId: headerData.customerId }
            : {}),
          ...(headerData.projectDate !== undefined
            ? { projectDate: headerData.projectDate }
            : {}),
          ...(headerData.projectName !== undefined
            ? { projectName: headerData.projectName }
            : {}),
          ...(headerData.projectTags !== undefined
            ? { projectTags: headerData.projectTags }
            : {}),
          ...(headerData.description !== undefined
            ? { description: headerData.description }
            : {}),
          ...(headerData.remarks !== undefined
            ? { remarks: headerData.remarks }
            : {}),
          ...(headerData.assignPmCode !== undefined
            ? { assignPmCode: headerData.assignPmCode }
            : {}),
          ...(headerData.assignTlCode !== undefined
            ? { assignTlCode: headerData.assignTlCode }
            : {}),
          ...(headerData.handoverDate !== undefined
            ? { handoverDate: headerData.handoverDate }
            : {}),
          ...(headerData.commissionDate !== undefined
            ? { commissionDate: headerData.commissionDate }
            : {}),
          ...(headerData.programDate !== undefined
            ? { programDate: headerData.programDate }
            : {}),
          ...(headerData.targetLpoDate !== undefined
            ? { targetLpoDate: headerData.targetLpoDate }
            : {}),
          ...(headerData.targetShipmentDate !== undefined
            ? { targetShipmentDate: headerData.targetShipmentDate }
            : {}),
          ...(headerData.deliverySiteDate !== undefined
            ? { deliverySiteDate: headerData.deliverySiteDate }
            : {}),
          ...(headerData.installationDate !== undefined
            ? { installationDate: headerData.installationDate }
            : {}),
          ...(headerData.discountPercentage !== undefined
            ? { discountPercentage: headerData.discountPercentage }
            : {}),
          ...(headerData.discountAmount !== undefined
            ? { discountAmount: headerData.discountAmount }
            : {}),
          ...(headerData.vatPerc !== undefined
            ? { vatPerc: headerData.vatPerc }
            : {}),
          ...(headerData.allowedAmount !== undefined
            ? { allowedAmount: headerData.allowedAmount }
            : {}),
          ...(headerData.boqFilePath !== undefined
            ? { boqFilePath: headerData.boqFilePath }
            : {}),
          ...totalsUpdate,
          updatedBy: username,
        },
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          details: { orderBy: { serialNo: "asc" } },
        },
      });

      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference: check customer ID",
          400,
          "INVALID_REFERENCE"
        );
      if (error.code === "P2025") throw new NotFoundError("Project not found");
    }
    throw error;
  }
}

// ─── Delete (soft - cancel) ────────────────────────

export async function deleteProject(id: number) {
  const existing = await prisma.projectMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Project not found");

  return prisma.projectMaster.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

// ─── Update Status ─────────────────────────────────

export async function updateStatus(id: number, data: StatusData) {
  const existing = await prisma.projectMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Project not found");

  return prisma.projectMaster.update({
    where: { id },
    data: { status: data.status },
  });
}

// ─── Roles ─────────────────────────────────────────

export async function getRoles(projectId: number) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  return prisma.projectRole.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, userCode: true, username: true } },
    },
  });
}

export async function addRole(projectId: number, data: RoleData) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  try {
    return await prisma.projectRole.create({
      data: {
        projectId,
        userId: data.userId,
        roleCode: data.roleCode,
        userRole: data.userRole ?? null,
      },
      include: {
        user: { select: { id: true, userCode: true, username: true } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new AppError(
          "This user already has this role on the project",
          400,
          "DUPLICATE_ROLE"
        );
      if (error.code === "P2003")
        throw new AppError("Invalid user ID", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function removeRole(roleId: number) {
  try {
    return await prisma.projectRole.delete({ where: { id: roleId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Role not found");
    }
    throw error;
  }
}

// ─── Remarks ───────────────────────────────────────

export async function getRemarks(projectId: number) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  return prisma.projectRemark.findMany({
    where: { projectId },
    orderBy: { serialNo: "asc" },
  });
}

export async function addRemark(
  projectId: number,
  data: RemarkData,
  username: string,
  branchCode: string
) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  const lastRemark = await prisma.projectRemark.findFirst({
    where: { projectId },
    orderBy: { serialNo: "desc" },
  });
  const serialNo = (lastRemark?.serialNo ?? 0) + 1;

  return prisma.projectRemark.create({
    data: {
      projectId,
      branchCode,
      serialNo,
      remarks: data.remarks,
      manualRemarks: data.manualRemarks ?? null,
      username,
      remarkDate: new Date(),
    },
  });
}

export async function updateRemark(remarkId: number, data: RemarkUpdateData) {
  try {
    return await prisma.projectRemark.update({
      where: { id: remarkId },
      data: {
        ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
        ...(data.manualRemarks !== undefined
          ? { manualRemarks: data.manualRemarks }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Remark not found");
    }
    throw error;
  }
}

export async function deleteRemark(remarkId: number) {
  try {
    return await prisma.projectRemark.delete({ where: { id: remarkId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Remark not found");
    }
    throw error;
  }
}

// ─── Document Details ──────────────────────────────

export async function getDocumentDetails(projectId: number) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  return prisma.projectDocumentDetail.findMany({
    where: { projectId },
    include: {
      document: { select: { id: true, documentCode: true, description: true } },
    },
    orderBy: { serialNo: "asc" },
  });
}

export async function addDocumentDetail(
  projectId: number,
  data: DocumentData,
  branchCode: string
) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  const lastDoc = await prisma.projectDocumentDetail.findFirst({
    where: { projectId },
    orderBy: { serialNo: "desc" },
  });
  const serialNo = (lastDoc?.serialNo ?? 0) + 1;

  try {
    return await prisma.projectDocumentDetail.create({
      data: {
        projectId,
        branchCode,
        serialNo,
        documentId: data.documentId,
        targetDate: data.targetDate,
        destinationPath: data.destinationPath,
      },
      include: {
        document: { select: { id: true, documentCode: true, description: true } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError("Invalid document ID", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateDocumentDetail(
  detailId: number,
  data: DocumentUpdateData
) {
  try {
    return await prisma.projectDocumentDetail.update({
      where: { id: detailId },
      data: {
        ...(data.isSelected !== undefined ? { isSelected: data.isSelected } : {}),
        ...(data.targetDate !== undefined ? { targetDate: data.targetDate } : {}),
        ...(data.destinationPath !== undefined
          ? { destinationPath: data.destinationPath }
          : {}),
        ...(data.uploadDocumentDate !== undefined
          ? { uploadDocumentDate: data.uploadDocumentDate }
          : {}),
      },
      include: {
        document: { select: { id: true, documentCode: true, description: true } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025")
        throw new NotFoundError("Document detail not found");
    }
    throw error;
  }
}

export async function deleteDocumentDetail(detailId: number) {
  try {
    return await prisma.projectDocumentDetail.delete({
      where: { id: detailId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025")
        throw new NotFoundError("Document detail not found");
    }
    throw error;
  }
}

// ─── Cumulative LPO Dates ──────────────────────────

export async function getCumulativeLpoDates(projectId: number) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  return prisma.cumulativeLpoDate.findMany({
    where: { projectId },
  });
}

export async function addCumulativeLpo(projectId: number, data: LpoData) {
  const project = await prisma.projectMaster.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project not found");

  return prisma.cumulativeLpoDate.create({
    data: {
      projectId,
      modelNo: data.modelNo,
      quantity: data.quantity ?? null,
      lpoDate: data.lpoDate ?? null,
      arrivalDate: data.arrivalDate ?? null,
    },
  });
}

export async function updateCumulativeLpo(id: number, data: LpoUpdateData) {
  try {
    return await prisma.cumulativeLpoDate.update({
      where: { id },
      data: {
        ...(data.modelNo !== undefined ? { modelNo: data.modelNo } : {}),
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.lpoDate !== undefined ? { lpoDate: data.lpoDate } : {}),
        ...(data.arrivalDate !== undefined
          ? { arrivalDate: data.arrivalDate }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025")
        throw new NotFoundError("Cumulative LPO entry not found");
    }
    throw error;
  }
}

export async function deleteCumulativeLpo(id: number) {
  try {
    return await prisma.cumulativeLpoDate.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025")
        throw new NotFoundError("Cumulative LPO entry not found");
    }
    throw error;
  }
}
