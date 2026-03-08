import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import { getNextNumber } from "./sequence.service";
import { calculateLineTotals, calculateQuotationTotals } from "./pricing.service";
import type { z } from "zod/v4";
import type {
  listQuotationsSchema,
  createQuotationSchema,
  updateQuotationSchema,
  addRemarkSchema,
} from "@/lib/validators/quotation";

type ListParams = z.infer<typeof listQuotationsSchema>;
type CreateData = z.infer<typeof createQuotationSchema>;
type UpdateData = z.infer<typeof updateQuotationSchema>;
type RemarkData = z.infer<typeof addRemarkSchema>;

// ─── List Quotations ────────────────────────────────

export async function listQuotations(params: ListParams) {
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

  const where: Prisma.SalesQuotationMasterWhereInput = {
    isArchived: false,
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
    ...(dateFrom || dateTo
      ? {
          quotationDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { quotationNo: { contains: search } },
            { description: { contains: search } },
            { customer: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.salesQuotationMaster.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.salesQuotationMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ──────────────────────────────────────

export async function getQuotationById(id: number) {
  const quotation = await prisma.salesQuotationMaster.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, customerCode: true } },
      quotationTerms: true,
      details: { orderBy: { serialNo: "asc" } },
      remarks: { orderBy: { serialNo: "asc" } },
    },
  });
  if (!quotation) throw new NotFoundError("Quotation not found");
  return quotation;
}

// ─── Create ─────────────────────────────────────────

export async function createQuotation(
  data: CreateData,
  username: string,
  branchCode: string
) {
  const quotationNo = await getNextNumber("QN");
  const { items, ...headerData } = data;

  const itemsWithTotals = calculateLineTotals(items);
  const totals = calculateQuotationTotals({
    items,
    discountPercentage: data.discountPercentage ?? 0,
    discountAmount: data.discountAmount ?? 0,
    vatPerc: data.vatPerc ?? 0,
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const master = await tx.salesQuotationMaster.create({
        data: {
          quotationNo,
          branchCode,
          quotationDate: headerData.quotationDate ?? new Date(),
          customerId: headerData.customerId,
          quotationTermsId: headerData.quotationTermsId ?? null,
          description: headerData.description ?? null,
          discountPercentage: headerData.discountPercentage ?? 0,
          discountAmount: headerData.discountAmount ?? 0,
          vatPerc: headerData.vatPerc ?? 0,
          commPerc: headerData.commPerc ?? null,
          commAmount: headerData.commAmount ?? null,
          totalAmount: totals.totalAmount,
          netAmount: totals.netAmount,
          vatAmount: totals.vatAmount,
          grossTotal: totals.grossTotal,
          createdBy: username,
          updatedBy: username,
        },
      });

      if (itemsWithTotals.length > 0) {
        await tx.salesQuotationDetail.createMany({
          data: itemsWithTotals.map((item, index) => ({
            quotationId: master.id,
            branchCode,
            serialNo: index + 1,
            barcode: item.barcode,
            itemDescription: item.itemDescription,
            model: item.model,
            location: item.location ?? null,
            mainLocation: item.mainLocation ?? null,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            fobPrice: item.fobPrice ?? 0,
            landedCost: item.landedCost ?? 0,
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
            vatAmount: item.vatAmount ?? 0,
          })),
        });
      }

      return tx.salesQuotationMaster.findUnique({
        where: { id: master.id },
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          details: { orderBy: { serialNo: "asc" } },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference: check customer or quotation terms ID",
          400,
          "INVALID_REFERENCE"
        );
    }
    throw error;
  }
}

// ─── Update ─────────────────────────────────────────

export async function updateQuotation(
  id: number,
  data: UpdateData,
  username: string
) {
  const existing = await prisma.salesQuotationMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Quotation not found");
  if (existing.status !== "QUOTATION") {
    throw new AppError(
      "Only quotations in QUOTATION status can be updated",
      400,
      "INVALID_STATUS"
    );
  }

  const { items, ...headerData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      let totalsUpdate = {};

      if (items !== undefined) {
        // Delete existing details and re-create
        await tx.salesQuotationDetail.deleteMany({
          where: { quotationId: id },
        });

        const itemsWithTotals = calculateLineTotals(items);
        const totals = calculateQuotationTotals({
          items,
          discountPercentage:
            headerData.discountPercentage ??
            Number(existing.discountPercentage),
          discountAmount:
            headerData.discountAmount ?? Number(existing.discountAmount),
          vatPerc: headerData.vatPerc ?? Number(existing.vatPerc),
        });

        totalsUpdate = {
          totalAmount: totals.totalAmount,
          netAmount: totals.netAmount,
          vatAmount: totals.vatAmount,
          grossTotal: totals.grossTotal,
        };

        if (itemsWithTotals.length > 0) {
          await tx.salesQuotationDetail.createMany({
            data: itemsWithTotals.map((item, index) => ({
              quotationId: id,
              branchCode: existing.branchCode,
              serialNo: index + 1,
              barcode: item.barcode,
              itemDescription: item.itemDescription,
              model: item.model,
              location: item.location ?? null,
              mainLocation: item.mainLocation ?? null,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              fobPrice: item.fobPrice ?? 0,
              landedCost: item.landedCost ?? 0,
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
              vatAmount: item.vatAmount ?? 0,
            })),
          });
        }
      }

      const updated = await tx.salesQuotationMaster.update({
        where: { id },
        data: {
          ...(headerData.customerId !== undefined
            ? { customerId: headerData.customerId }
            : {}),
          ...(headerData.quotationDate !== undefined
            ? { quotationDate: headerData.quotationDate }
            : {}),
          ...(headerData.quotationTermsId !== undefined
            ? { quotationTermsId: headerData.quotationTermsId }
            : {}),
          ...(headerData.description !== undefined
            ? { description: headerData.description }
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
          ...(headerData.commPerc !== undefined
            ? { commPerc: headerData.commPerc }
            : {}),
          ...(headerData.commAmount !== undefined
            ? { commAmount: headerData.commAmount }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003")
        throw new AppError(
          "Invalid reference: check customer or quotation terms ID",
          400,
          "INVALID_REFERENCE"
        );
      if (error.code === "P2025") throw new NotFoundError("Quotation not found");
    }
    throw error;
  }
}

// ─── Delete (soft) ──────────────────────────────────

export async function deleteQuotation(id: number) {
  const existing = await prisma.salesQuotationMaster.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Quotation not found");
  if (existing.status !== "QUOTATION") {
    throw new AppError(
      "Only quotations in QUOTATION status can be deleted",
      400,
      "INVALID_STATUS"
    );
  }

  return prisma.salesQuotationMaster.update({
    where: { id },
    data: { isArchived: true },
  });
}

// ─── Submit ─────────────────────────────────────────

export async function submitQuotation(id: number, username: string) {
  const existing = await prisma.salesQuotationMaster.findUnique({
    where: { id },
    include: { _count: { select: { details: true } } },
  });
  if (!existing) throw new NotFoundError("Quotation not found");
  if (existing.status !== "QUOTATION") {
    throw new AppError(
      "Only quotations in QUOTATION status can be submitted",
      400,
      "INVALID_STATUS"
    );
  }
  if (existing._count.details === 0) {
    throw new AppError(
      "Quotation must have at least one line item before submitting",
      400,
      "NO_LINE_ITEMS"
    );
  }

  return prisma.salesQuotationMaster.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      committedBy: username,
      committedDate: new Date(),
      updatedBy: username,
    },
  });
}

// ─── Revise ─────────────────────────────────────────

export async function reviseQuotation(
  id: number,
  username: string,
  branchCode: string
) {
  const existing = await prisma.salesQuotationMaster.findUnique({
    where: { id },
    include: {
      details: true,
      remarks: true,
    },
  });
  if (!existing) throw new NotFoundError("Quotation not found");

  const quotationNo = await getNextNumber("QN");

  return prisma.$transaction(async (tx) => {
    // Mark original as having a revision
    await tx.salesQuotationMaster.update({
      where: { id },
      data: { hasRevision: true },
    });

    // Create new quotation as a copy
    const newMaster = await tx.salesQuotationMaster.create({
      data: {
        quotationNo,
        branchCode,
        quotationDate: new Date(),
        customerId: existing.customerId,
        quotationTermsId: existing.quotationTermsId,
        description: existing.description,
        status: "QUOTATION",
        revisionNo: existing.revisionNo + 1,
        totalAmount: existing.totalAmount,
        discountPercentage: existing.discountPercentage,
        discountAmount: existing.discountAmount,
        netAmount: existing.netAmount,
        vatPerc: existing.vatPerc,
        vatAmount: existing.vatAmount,
        grossTotal: existing.grossTotal,
        commPerc: existing.commPerc,
        commAmount: existing.commAmount,
        createdBy: username,
        updatedBy: username,
      },
    });

    // Copy details
    if (existing.details.length > 0) {
      await tx.salesQuotationDetail.createMany({
        data: existing.details.map((d) => ({
          quotationId: newMaster.id,
          branchCode: d.branchCode,
          serialNo: d.serialNo,
          barcode: d.barcode,
          itemDescription: d.itemDescription,
          model: d.model,
          location: d.location,
          mainLocation: d.mainLocation,
          quantity: d.quantity,
          rate: d.rate,
          amount: d.amount,
          fobPrice: d.fobPrice,
          landedCost: d.landedCost,
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
          vatAmount: d.vatAmount,
        })),
      });
    }

    // Copy remarks
    if (existing.remarks.length > 0) {
      await tx.quotationRemark.createMany({
        data: existing.remarks.map((r) => ({
          quotationId: newMaster.id,
          branchCode: r.branchCode,
          serialNo: r.serialNo,
          remarks: r.remarks,
          username: r.username,
          remarkDate: r.remarkDate,
        })),
      });
    }

    return tx.salesQuotationMaster.findUnique({
      where: { id: newMaster.id },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        details: { orderBy: { serialNo: "asc" } },
        remarks: { orderBy: { serialNo: "asc" } },
      },
    });
  });
}

// ─── Remarks ────────────────────────────────────────

export async function getRemarks(quotationId: number) {
  const quotation = await prisma.salesQuotationMaster.findUnique({
    where: { id: quotationId },
  });
  if (!quotation) throw new NotFoundError("Quotation not found");

  return prisma.quotationRemark.findMany({
    where: { quotationId },
    orderBy: { serialNo: "asc" },
  });
}

export async function addRemark(
  quotationId: number,
  data: RemarkData,
  username: string,
  branchCode: string
) {
  const quotation = await prisma.salesQuotationMaster.findUnique({
    where: { id: quotationId },
  });
  if (!quotation) throw new NotFoundError("Quotation not found");

  // Get next serial number
  const lastRemark = await prisma.quotationRemark.findFirst({
    where: { quotationId },
    orderBy: { serialNo: "desc" },
  });
  const serialNo = (lastRemark?.serialNo ?? 0) + 1;

  return prisma.quotationRemark.create({
    data: {
      quotationId,
      branchCode,
      serialNo,
      remarks: data.remarks,
      username,
      remarkDate: new Date(),
    },
  });
}

export async function updateRemark(remarkId: number, data: RemarkData) {
  try {
    return await prisma.quotationRemark.update({
      where: { id: remarkId },
      data: { remarks: data.remarks },
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
    return await prisma.quotationRemark.delete({ where: { id: remarkId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundError("Remark not found");
    }
    throw error;
  }
}
