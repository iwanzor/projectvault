import type { PrismaClient } from "../src/generated/prisma/client";

// ── helpers ─────────────────────────────────────────────────────────
/** Return a Date offset by `days` from "today" (2025-12-15 baseline) */
function daysAgo(days: number): Date {
  const base = new Date("2025-12-15");
  base.setDate(base.getDate() - days);
  return base;
}

function pad(n: number, len = 6): string {
  return String(n).padStart(len, "0");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ────────────────────────────────────────────────────────────────────
export async function seedTransactions(prisma: PrismaClient) {
  console.log("Seeding transactional data...");

  // ═══════════════════════════════════════════════════════════════════
  // 1. Sequences
  // ═══════════════════════════════════════════════════════════════════
  const sequences = [
    { objectName: "QN", objectKey: 20 },
    { objectName: "PJ", objectKey: 15 },
    { objectName: "MR", objectKey: 10 },
    { objectName: "PO", objectKey: 15 },
    { objectName: "GRN", objectKey: 10 },
    { objectName: "GIN", objectKey: 8 },
    { objectName: "GTN", objectKey: 5 },
    { objectName: "GRRN", objectKey: 5 },
    { objectName: "TXN", objectKey: 40 },
    { objectName: "INV", objectKey: 5 },
  ];

  for (const seq of sequences) {
    await prisma.sequence.upsert({
      where: { objectName: seq.objectName },
      update: { objectKey: BigInt(seq.objectKey) },
      create: {
        objectName: seq.objectName,
        objectKey: BigInt(seq.objectKey),
        lastDate: new Date("2025-12-15"),
      },
    });
  }
  console.log("  Sequences seeded (10)");

  // ═══════════════════════════════════════════════════════════════════
  // Fetch reference data we need
  // ═══════════════════════════════════════════════════════════════════
  const customers = await prisma.customer.findMany({ take: 10 });
  if (customers.length === 0) {
    throw new Error("No customers found - run seed-master first");
  }

  const items = await prisma.item.findMany({
    take: 25,
    include: { unit: true, brand: true },
  });
  if (items.length === 0) {
    throw new Error("No items found - run seed-master first");
  }

  const suppliers = await prisma.supplier.findMany({ take: 8 });
  if (suppliers.length === 0) {
    throw new Error("No suppliers found - run seed-master first");
  }

  const banks = await prisma.bank.findMany({ take: 3 });
  const bankAccounts = await prisma.bankAccount.findMany({ take: 3 });

  const accEmployees = await prisma.accEmployee.findMany({ take: 8 });
  const accProjects = await prisma.accProject.findMany({ take: 5 });
  const accPositions = await prisma.accPosition.findMany({ take: 4 });
  const accDepartments = await prisma.accDepartment.findMany({ take: 3 });
  const accStatuses = await prisma.accEmployeeStatus.findMany({ take: 2 });
  const accRemarks = await prisma.accRemark.findMany({ take: 3 });

  const quotationTerms = await prisma.quotationTerms.findMany({ take: 3 });
  const purposes = await prisma.purpose.findMany({ take: 5 });
  const paymentTypes = await prisma.paymentType.findMany({ take: 3 });
  const paymentChannels = await prisma.paymentChannel.findMany({ take: 3 });

  // ═══════════════════════════════════════════════════════════════════
  // 2. Sales Quotations (15)
  // ═══════════════════════════════════════════════════════════════════
  type SQStatusType = "QUOTATION" | "SUBMITTED" | "PROJECT" | "ARCHIVED";

  interface QuotationSpec {
    qnIdx: number;
    status: SQStatusType;
    daysBack: number;
    customerIdx: number;
    discPerc: number;
    detailCount: number;
    termsIdx: number;
  }

  const quotationSpecs: QuotationSpec[] = [
    // QN-000001 to QN-000005: QUOTATION (last 2 weeks)
    { qnIdx: 1, status: "QUOTATION", daysBack: 2, customerIdx: 0, discPerc: 0, detailCount: 4, termsIdx: 0 },
    { qnIdx: 2, status: "QUOTATION", daysBack: 5, customerIdx: 1, discPerc: 3, detailCount: 5, termsIdx: 1 },
    { qnIdx: 3, status: "QUOTATION", daysBack: 7, customerIdx: 2, discPerc: 5, detailCount: 3, termsIdx: 0 },
    { qnIdx: 4, status: "QUOTATION", daysBack: 10, customerIdx: 3, discPerc: 0, detailCount: 6, termsIdx: 2 },
    { qnIdx: 5, status: "QUOTATION", daysBack: 13, customerIdx: 4, discPerc: 2, detailCount: 4, termsIdx: 1 },
    // QN-000006 to QN-000010: SUBMITTED (2-4 weeks ago)
    { qnIdx: 6, status: "SUBMITTED", daysBack: 16, customerIdx: 5, discPerc: 5, detailCount: 5, termsIdx: 0 },
    { qnIdx: 7, status: "SUBMITTED", daysBack: 19, customerIdx: 6, discPerc: 3, detailCount: 7, termsIdx: 2 },
    { qnIdx: 8, status: "SUBMITTED", daysBack: 22, customerIdx: 7, discPerc: 8, detailCount: 4, termsIdx: 1 },
    { qnIdx: 9, status: "SUBMITTED", daysBack: 25, customerIdx: 8, discPerc: 0, detailCount: 6, termsIdx: 0 },
    { qnIdx: 10, status: "SUBMITTED", daysBack: 28, customerIdx: 9, discPerc: 10, detailCount: 5, termsIdx: 2 },
    // QN-000011 to QN-000013: PROJECT (1-2 months ago)
    { qnIdx: 11, status: "PROJECT", daysBack: 40, customerIdx: 0, discPerc: 5, detailCount: 8, termsIdx: 0 },
    { qnIdx: 12, status: "PROJECT", daysBack: 50, customerIdx: 1, discPerc: 7, detailCount: 6, termsIdx: 1 },
    { qnIdx: 13, status: "PROJECT", daysBack: 55, customerIdx: 2, discPerc: 3, detailCount: 5, termsIdx: 2 },
    // QN-000014 to QN-000015: ARCHIVED (3 months ago)
    { qnIdx: 14, status: "ARCHIVED", daysBack: 85, customerIdx: 3, discPerc: 5, detailCount: 4, termsIdx: 0 },
    { qnIdx: 15, status: "ARCHIVED", daysBack: 90, customerIdx: 4, discPerc: 10, detailCount: 3, termsIdx: 1 },
  ];

  const quotationDescriptions = [
    "MEP fit-out for office tower level 15",
    "HVAC supply and installation - warehouse facility",
    "Electrical panel boards and switchgear supply",
    "Fire fighting system design and supply",
    "Plumbing materials for residential villa project",
    "Low current systems - CCTV and access control",
    "Chiller plant room equipment and piping",
    "Complete MEP package for retail mall",
    "Distribution boards and wiring accessories",
    "VRF system supply for commercial building",
    "Civil and structural MEP coordination",
    "Full MEP supply for school building",
    "Lighting fixtures and control systems",
    "Industrial automation panel supply",
    "HVAC ducting and insulation materials",
  ];

  const createdQuotationIds: number[] = [];

  for (const spec of quotationSpecs) {
    const quotationNo = `QN-${pad(spec.qnIdx)}`;

    // Check if already exists
    const existing = await prisma.salesQuotationMaster.findUnique({
      where: { quotationNo },
    });
    if (existing) {
      createdQuotationIds.push(existing.id);
      continue;
    }

    const custIdx = spec.customerIdx % customers.length;
    const customer = customers[custIdx];
    const termsId = quotationTerms.length > 0 ? quotationTerms[spec.termsIdx % quotationTerms.length].id : undefined;

    // Build detail lines
    const details: Array<{
      branchCode: string;
      barcode: string;
      serialNo: number;
      itemDescription: string;
      model: string;
      location: string;
      quantity: number;
      rate: number;
      amount: number;
      fobPrice: number;
      landedCost: number;
      estShipPara: number;
      estAmount: number;
      estFobPrice: number;
      estLandedCost: number;
      estUnitPrice: number;
      vatAmount: number;
    }> = [];

    let totalAmount = 0;

    for (let d = 0; d < spec.detailCount; d++) {
      const item = items[(spec.qnIdx * 3 + d) % items.length];
      const qty = [2, 5, 10, 15, 20, 25, 50, 100][(spec.qnIdx + d) % 8];
      const rate = round2(Number(item.salesRate) || (Number(item.fobPrice) * 1.3) || 150 + d * 50);
      const fob = round2(Number(item.fobPrice) || rate * 0.7);
      const amount = round2(qty * rate);
      const landed = round2(fob * 1.1);
      const estAmount = round2(qty * fob);
      const vatAmt = round2(amount * 0.05);

      details.push({
        branchCode: "HQ",
        barcode: item.barcode,
        serialNo: d + 1,
        itemDescription: item.name,
        model: item.modelNo,
        location: ["Zone A", "Zone B", "Zone C", "Main Store"][d % 4],
        quantity: qty,
        rate,
        amount,
        fobPrice: fob,
        landedCost: landed,
        estShipPara: 0.02,
        estAmount,
        estFobPrice: fob,
        estLandedCost: landed,
        estUnitPrice: rate,
        vatAmount: vatAmt,
      });

      totalAmount += amount;
    }

    const discountAmount = round2(totalAmount * spec.discPerc / 100);
    const netAmount = round2(totalAmount - discountAmount);
    const vatPerc = 5;
    const vatAmount = round2(netAmount * vatPerc / 100);
    const grossTotal = round2(netAmount + vatAmount);

    const usedInProject = spec.status === "PROJECT";
    const isArchived = spec.status === "ARCHIVED";

    try {
      const q = await prisma.salesQuotationMaster.create({
        data: {
          quotationNo,
          branchCode: "HQ",
          quotationDate: daysAgo(spec.daysBack),
          customerId: customer.id,
          quotationTermsId: termsId ?? null,
          description: quotationDescriptions[spec.qnIdx - 1],
          status: spec.status,
          revisionNo: 0,
          totalAmount,
          discountPercentage: spec.discPerc,
          discountAmount,
          netAmount,
          vatPerc,
          vatAmount,
          grossTotal,
          usedInProject,
          isArchived,
          createdBy: "admin",
          details: {
            create: details,
          },
        },
      });
      createdQuotationIds.push(q.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped quotation ${quotationNo}: ${msg}`);
    }
  }
  console.log(`  Sales Quotations seeded (${createdQuotationIds.length})`);

  // ═══════════════════════════════════════════════════════════════════
  // 3. Quotation Remarks (~10)
  // ═══════════════════════════════════════════════════════════════════
  const remarkTexts = [
    "Customer requested revised pricing for bulk order",
    "Technical specifications confirmed with engineering team",
    "Delivery schedule aligned with project timeline",
    "Alternative brands suggested due to lead time constraints",
    "Customer approved the design layout",
    "Waiting for site measurements confirmation",
    "Payment terms negotiated - 30 days from delivery",
    "Scope change requested by customer",
    "Materials availability confirmed with suppliers",
    "Follow-up meeting scheduled for next week",
  ];

  let remarkCount = 0;
  for (let r = 0; r < 10; r++) {
    const qIdx = [0, 0, 1, 2, 4, 5, 6, 7, 10, 11][r];
    if (qIdx >= createdQuotationIds.length) continue;
    const quotationId = createdQuotationIds[qIdx];
    try {
      await prisma.quotationRemark.create({
        data: {
          quotationId,
          branchCode: "HQ",
          serialNo: (r % 2) + 1,
          remarks: remarkTexts[r],
          username: "admin",
          remarkDate: daysAgo(90 - r * 5),
        },
      });
      remarkCount++;
    } catch {
      // skip duplicates
    }
  }
  console.log(`  Quotation Remarks seeded (${remarkCount})`);

  // ═══════════════════════════════════════════════════════════════════
  // 4. Projects (10)
  // ═══════════════════════════════════════════════════════════════════
  type ProjStatusType = "ACTIVE" | "ON_HOLD" | "COMPLETED";

  interface ProjectSpec {
    pjIdx: number;
    status: ProjStatusType;
    daysBack: number;
    qnIdx: number; // which quotation (0-based index into createdQuotationIds)
    customerIdx: number;
  }

  const projectSpecs: ProjectSpec[] = [
    { pjIdx: 1, status: "ACTIVE", daysBack: 35, qnIdx: 10, customerIdx: 0 },
    { pjIdx: 2, status: "ACTIVE", daysBack: 38, qnIdx: 11, customerIdx: 1 },
    { pjIdx: 3, status: "ACTIVE", daysBack: 42, qnIdx: 12, customerIdx: 2 },
    { pjIdx: 4, status: "ACTIVE", daysBack: 15, qnIdx: 5, customerIdx: 5 },
    { pjIdx: 5, status: "ACTIVE", daysBack: 18, qnIdx: 6, customerIdx: 6 },
    { pjIdx: 6, status: "ON_HOLD", daysBack: 50, qnIdx: 7, customerIdx: 7 },
    { pjIdx: 7, status: "ON_HOLD", daysBack: 55, qnIdx: 8, customerIdx: 8 },
    { pjIdx: 8, status: "COMPLETED", daysBack: 80, qnIdx: 13, customerIdx: 3 },
    { pjIdx: 9, status: "COMPLETED", daysBack: 85, qnIdx: 14, customerIdx: 4 },
    { pjIdx: 10, status: "COMPLETED", daysBack: 70, qnIdx: 9, customerIdx: 9 },
  ];

  const projectNames = [
    "MEP Fit-out - Office Tower L15",
    "HVAC Installation - Warehouse Facility",
    "Electrical Panels - Commercial Complex",
    "Low Current Systems - Office Building",
    "Chiller Plant Room - Mixed Use Tower",
    "MEP Package - Retail Mall Phase 1",
    "Distribution Boards - Residential Tower",
    "Fire Fighting System - Industrial Park",
    "Lighting Systems - School Building",
    "VRF System - Commercial Building",
  ];

  const createdProjectIds: number[] = [];
  const projectNoList: string[] = [];

  for (const spec of projectSpecs) {
    const projectNo = `PJ-${pad(spec.pjIdx)}`;

    const existing = await prisma.projectMaster.findUnique({ where: { projectNo } });
    if (existing) {
      createdProjectIds.push(existing.id);
      projectNoList.push(projectNo);
      continue;
    }

    const custIdx = spec.customerIdx % customers.length;
    const customer = customers[custIdx];
    const quotationId = spec.qnIdx < createdQuotationIds.length ? createdQuotationIds[spec.qnIdx] : null;

    // Fetch quotation details for project detail lines
    let qnDetails: Array<{
      barcode: string;
      serialNo: number;
      itemDescription: string;
      model: string;
      location: string | null;
      quantity: { toNumber?: () => number } | number;
      rate: { toNumber?: () => number } | number;
      amount: { toNumber?: () => number } | number;
      fobPrice: { toNumber?: () => number } | number;
      landedCost: { toNumber?: () => number } | number;
      vatAmount: { toNumber?: () => number } | number;
    }> = [];

    if (quotationId) {
      const qn = await prisma.salesQuotationMaster.findUnique({
        where: { id: quotationId },
        include: { details: true },
      });
      if (qn) {
        qnDetails = qn.details;
      }
    }

    const detailItems = qnDetails.length > 0
      ? qnDetails
      : items.slice(0, 4).map((item, i) => ({
          barcode: item.barcode,
          serialNo: i + 1,
          itemDescription: item.name,
          model: item.modelNo,
          location: "Zone A",
          quantity: 10,
          rate: Number(item.salesRate) || 200,
          amount: 10 * (Number(item.salesRate) || 200),
          fobPrice: Number(item.fobPrice) || 140,
          landedCost: (Number(item.fobPrice) || 140) * 1.1,
          vatAmount: 10 * (Number(item.salesRate) || 200) * 0.05,
        }));

    const quotationNo = quotationId ? `QN-${pad(spec.qnIdx - (spec.qnIdx >= 10 ? 0 : -1) + 1)}` : `QN-${pad(spec.pjIdx)}`;

    // Resolve quotation no from the actual quotation
    let resolvedQnNo = `QN-${pad(spec.pjIdx)}`;
    if (quotationId) {
      const qnData = await prisma.salesQuotationMaster.findUnique({ where: { id: quotationId } });
      if (qnData) resolvedQnNo = qnData.quotationNo;
    }

    let totalAmount = 0;
    const projDetails = detailItems.map((d, i) => {
      const qty = typeof d.quantity === "object" && d.quantity && "toNumber" in d.quantity
        ? (d.quantity as { toNumber: () => number }).toNumber()
        : Number(d.quantity);
      const rate = typeof d.rate === "object" && d.rate && "toNumber" in d.rate
        ? (d.rate as { toNumber: () => number }).toNumber()
        : Number(d.rate);
      const fob = typeof d.fobPrice === "object" && d.fobPrice && "toNumber" in d.fobPrice
        ? (d.fobPrice as { toNumber: () => number }).toNumber()
        : Number(d.fobPrice);
      const landed = typeof d.landedCost === "object" && d.landedCost && "toNumber" in d.landedCost
        ? (d.landedCost as { toNumber: () => number }).toNumber()
        : Number(d.landedCost);
      const amount = round2(qty * rate);
      totalAmount += amount;

      return {
        branchCode: "HQ",
        quotationNo: resolvedQnNo,
        barcode: d.barcode,
        serialNo: i + 1,
        model: d.model,
        itemDescription: typeof d.itemDescription === "string" ? d.itemDescription : String(d.itemDescription),
        location: d.location ?? "Zone A",
        fobPrice: round2(fob),
        landedCost: round2(landed),
        quantity: qty,
        rate,
        amount,
        estShipPara: 0.02,
        estAmount: round2(qty * fob),
        estFobPrice: round2(fob),
        estLandedCost: round2(landed),
        estUnitPrice: round2(rate),
        vatPerc: 5,
        vatAmount: round2(amount * 0.05),
      };
    });

    const discPerc = [5, 7, 3, 0, 5, 8, 3, 5, 10, 5][spec.pjIdx - 1];
    const discountAmount = round2(totalAmount * discPerc / 100);
    const netAmount = round2(totalAmount - discountAmount);
    const vatAmount = round2(netAmount * 0.05);
    const grossTotal = round2(netAmount + vatAmount);

    try {
      const p = await prisma.projectMaster.create({
        data: {
          projectNo,
          branchCode: "HQ",
          projectDate: daysAgo(spec.daysBack),
          customerId: customer.id,
          quotationId,
          projectName: projectNames[spec.pjIdx - 1],
          description: projectNames[spec.pjIdx - 1],
          status: spec.status,
          totalAmount,
          discountPercentage: discPerc,
          discountAmount,
          netAmount,
          vatPerc: 5,
          vatAmount,
          grossTotal,
          createdBy: "admin",
          details: {
            create: projDetails,
          },
        },
      });
      createdProjectIds.push(p.id);
      projectNoList.push(projectNo);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped project ${projectNo}: ${msg}`);
      projectNoList.push(projectNo);
    }
  }
  console.log(`  Projects seeded (${createdProjectIds.length})`);

  // ═══════════════════════════════════════════════════════════════════
  // 5. Project Remarks (~5)
  // ═══════════════════════════════════════════════════════════════════
  const projectRemarkTexts = [
    "Site mobilization completed, work commenced",
    "Material delivery delayed - revised schedule pending",
    "Inspection passed - proceeding to next phase",
    "Client requested scope modification",
    "Project completion ahead of schedule",
  ];

  let projRemarkCount = 0;
  for (let r = 0; r < 5; r++) {
    if (r >= createdProjectIds.length) break;
    try {
      await prisma.projectRemark.create({
        data: {
          projectId: createdProjectIds[r],
          branchCode: "HQ",
          serialNo: 1,
          remarks: projectRemarkTexts[r],
          username: "admin",
          remarkDate: daysAgo(30 - r * 5),
        },
      });
      projRemarkCount++;
    } catch {
      // skip
    }
  }
  console.log(`  Project Remarks seeded (${projRemarkCount})`);

  // ═══════════════════════════════════════════════════════════════════
  // 6. Material Requests (8)
  // ═══════════════════════════════════════════════════════════════════
  type MRStatusType = "DRAFT" | "APPROVED" | "REJECTED" | "COMPLETED";

  interface MRSpec {
    mrIdx: number;
    status: MRStatusType;
    projectIdx: number;
    detailCount: number;
    daysBack: number;
  }

  const mrSpecs: MRSpec[] = [
    { mrIdx: 1, status: "DRAFT", projectIdx: 0, detailCount: 4, daysBack: 5 },
    { mrIdx: 2, status: "DRAFT", projectIdx: 1, detailCount: 3, daysBack: 8 },
    { mrIdx: 3, status: "APPROVED", projectIdx: 0, detailCount: 5, daysBack: 15 },
    { mrIdx: 4, status: "APPROVED", projectIdx: 2, detailCount: 4, daysBack: 20 },
    { mrIdx: 5, status: "APPROVED", projectIdx: 3, detailCount: 3, daysBack: 25 },
    { mrIdx: 6, status: "APPROVED", projectIdx: 4, detailCount: 5, daysBack: 30 },
    { mrIdx: 7, status: "REJECTED", projectIdx: 1, detailCount: 3, daysBack: 35 },
    { mrIdx: 8, status: "COMPLETED", projectIdx: 0, detailCount: 4, daysBack: 45 },
  ];

  const mrDescriptions = [
    "Cables and wiring accessories for Level 15",
    "HVAC control components - warehouse project",
    "Switchgear and distribution boards",
    "Plumbing fittings and valves",
    "Fire detection equipment",
    "Ducting materials for chiller room",
    "Replacement lighting fixtures",
    "Insulation materials for pipe work",
  ];

  for (const spec of mrSpecs) {
    const mrCode = `MR-${pad(spec.mrIdx)}`;

    const existing = await prisma.materialRequestMaster.findUnique({
      where: { materialRequestCode: mrCode },
    });
    if (existing) continue;

    const projIdx = spec.projectIdx % createdProjectIds.length;
    const projectId = createdProjectIds[projIdx];
    const pNo = projectNoList[projIdx] ?? `PJ-${pad(projIdx + 1)}`;

    const mrDetails = [];
    let totalAmt = 0;
    for (let d = 0; d < spec.detailCount; d++) {
      const item = items[(spec.mrIdx * 2 + d) % items.length];
      const qty = [5, 10, 15, 20, 25][(spec.mrIdx + d) % 5];
      const landed = round2(Number(item.fobPrice) * 1.1 || 120);
      const estLanded = round2(landed * 0.95);
      const totCost = round2(qty * landed);
      totalAmt += totCost;

      mrDetails.push({
        branchCode: "HQ",
        projectNo: pNo,
        barcode: item.barcode,
        modelNo: item.modelNo.substring(0, 50),
        itemDescription: item.name,
        unitCode: item.unit.unitCode,
        quantity: qty,
        landedCostDb: landed,
        estimatedLandedCostDb: estLanded,
        responseLandedCost: landed,
        currency: "AED",
        totCostDb: totCost,
        actualCost: totCost,
        mrDetailType: 0,
      });
    }

    try {
      await prisma.materialRequestMaster.create({
        data: {
          materialRequestCode: mrCode,
          branchCode: "HQ",
          projectId,
          description: mrDescriptions[spec.mrIdx - 1],
          totalAmount: round2(totalAmt),
          mrStatus: spec.status,
          isApproved: spec.status === "APPROVED" || spec.status === "COMPLETED" ? true : spec.status === "REJECTED" ? false : null,
          createdBy: "admin",
          details: {
            create: mrDetails,
          },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped MR ${mrCode}: ${msg}`);
    }
  }
  console.log("  Material Requests seeded (8)");

  // ═══════════════════════════════════════════════════════════════════
  // 7. Purchase Orders (10)
  // ═══════════════════════════════════════════════════════════════════
  type POStatusType = "DRAFT" | "APPROVED" | "RECEIVED" | "CANCELLED";

  interface POSpec {
    poIdx: number;
    status: POStatusType;
    supplierIdx: number;
    projectIdx: number;
    detailCount: number;
    discPerc: number;
    daysBack: number;
  }

  const poSpecs: POSpec[] = [
    { poIdx: 1, status: "DRAFT", supplierIdx: 0, projectIdx: 0, detailCount: 4, discPerc: 0, daysBack: 3 },
    { poIdx: 2, status: "DRAFT", supplierIdx: 1, projectIdx: 1, detailCount: 3, discPerc: 5, daysBack: 6 },
    { poIdx: 3, status: "APPROVED", supplierIdx: 2, projectIdx: 0, detailCount: 5, discPerc: 3, daysBack: 12 },
    { poIdx: 4, status: "APPROVED", supplierIdx: 3, projectIdx: 2, detailCount: 4, discPerc: 0, daysBack: 18 },
    { poIdx: 5, status: "APPROVED", supplierIdx: 4, projectIdx: 3, detailCount: 6, discPerc: 5, daysBack: 22 },
    { poIdx: 6, status: "RECEIVED", supplierIdx: 0, projectIdx: 0, detailCount: 4, discPerc: 3, daysBack: 30 },
    { poIdx: 7, status: "RECEIVED", supplierIdx: 1, projectIdx: 1, detailCount: 5, discPerc: 0, daysBack: 40 },
    { poIdx: 8, status: "RECEIVED", supplierIdx: 2, projectIdx: 2, detailCount: 3, discPerc: 5, daysBack: 50 },
    { poIdx: 9, status: "CANCELLED", supplierIdx: 5, projectIdx: 4, detailCount: 3, discPerc: 0, daysBack: 60 },
    { poIdx: 10, status: "CANCELLED", supplierIdx: 6, projectIdx: 3, detailCount: 4, discPerc: 10, daysBack: 65 },
  ];

  const poDescriptions = [
    "Cables and accessories order",
    "HVAC units procurement",
    "Switchgear supply order",
    "Plumbing materials order",
    "Fire fighting equipment",
    "Distribution boards purchase",
    "Lighting fixtures order",
    "Ducting materials procurement",
    "Insulation materials order (cancelled)",
    "Pump supply order (cancelled)",
  ];

  for (const spec of poSpecs) {
    const poNo = `PO-${pad(spec.poIdx)}`;

    const existing = await prisma.purchaseOrderMaster.findUnique({
      where: { purchaseOrderNo: poNo },
    });
    if (existing) continue;

    const supplier = suppliers[spec.supplierIdx % suppliers.length];
    const pNo = projectNoList[spec.projectIdx % projectNoList.length] ?? `PJ-${pad(spec.projectIdx + 1)}`;

    const poDetails = [];
    let totalAmount = 0;
    for (let d = 0; d < spec.detailCount; d++) {
      const item = items[(spec.poIdx * 3 + d) % items.length];
      const qty = [5, 10, 15, 20, 30, 50][(spec.poIdx + d) % 6];
      const defFob = round2(Number(item.fobPrice) || 100 + d * 30);
      const totDefFob = round2(qty * defFob);
      const actualFob = round2(defFob * 0.95);
      const totActualFob = round2(qty * actualFob);
      const convRate = 1;
      const actualFobAed = actualFob;
      const totActualFobAed = totActualFob;
      const vatP = 5;
      const vatAmt = round2(totActualFobAed * vatP / 100);

      totalAmount += totActualFobAed;

      poDetails.push({
        branchCode: "HQ",
        serialNo: d + 1,
        barcode: item.barcode,
        unitCode: item.unit.unitCode,
        itemDescription: item.name,
        quantity: qty,
        defFob,
        currency: "AED",
        totDefFobAmount: totDefFob,
        actualFob,
        actualCurrency: "AED",
        totActualFobAmount: totActualFob,
        convRate,
        actualFobAed,
        totActualFobAed,
        vatPerc: vatP,
        vatAmount: vatAmt,
      });
    }

    const discountAmount = round2(totalAmount * spec.discPerc / 100);
    const netAmount = round2(totalAmount - discountAmount);
    const vatPerc = 5;
    const vatAmount = round2(netAmount * vatPerc / 100);
    const grossTotal = round2(netAmount + vatAmount);

    try {
      await prisma.purchaseOrderMaster.create({
        data: {
          purchaseOrderNo: poNo,
          branchCode: "HQ",
          purchaseOrderDate: daysAgo(spec.daysBack),
          supplierId: supplier.id,
          projectNo: pNo,
          description: poDescriptions[spec.poIdx - 1],
          status: spec.status,
          totalAmount,
          discountPercentage: spec.discPerc,
          discountAmount,
          netAmount,
          vatPerc,
          vatAmount,
          grossTotal,
          createdBy: "admin",
          details: {
            create: poDetails,
          },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped PO ${poNo}: ${msg}`);
    }
  }
  console.log("  Purchase Orders seeded (10)");

  // ═══════════════════════════════════════════════════════════════════
  // 8. GRN (8) - for RECEIVED POs
  // ═══════════════════════════════════════════════════════════════════
  const grnSpecs = [
    { grnIdx: 1, poIdx: 6, supplierIdx: 0, daysBack: 25 },
    { grnIdx: 2, poIdx: 6, supplierIdx: 0, daysBack: 26 },
    { grnIdx: 3, poIdx: 7, supplierIdx: 1, daysBack: 33 },
    { grnIdx: 4, poIdx: 7, supplierIdx: 1, daysBack: 35 },
    { grnIdx: 5, poIdx: 7, supplierIdx: 1, daysBack: 37 },
    { grnIdx: 6, poIdx: 8, supplierIdx: 2, daysBack: 43 },
    { grnIdx: 7, poIdx: 8, supplierIdx: 2, daysBack: 45 },
    { grnIdx: 8, poIdx: 3, supplierIdx: 2, daysBack: 10 },
  ];

  for (const spec of grnSpecs) {
    const grnNo = `GRN-${pad(spec.grnIdx)}`;

    const existing = await prisma.grnMaster.findUnique({ where: { grnNo } });
    if (existing) continue;

    const supplier = suppliers[spec.supplierIdx % suppliers.length];
    const poNo = `PO-${pad(spec.poIdx)}`;
    const projIdx = [0, 0, 1, 1, 1, 2, 2, 0][spec.grnIdx - 1] % projectNoList.length;
    const pNo = projectNoList[projIdx] ?? `PJ-${pad(projIdx + 1)}`;

    const detailCount = [3, 2, 4, 3, 2, 3, 2, 4][spec.grnIdx - 1];
    const grnDetails = [];
    let totalAmount = 0;
    for (let d = 0; d < detailCount; d++) {
      const item = items[(spec.grnIdx * 2 + d) % items.length];
      const qty = [5, 10, 15, 8, 12][(spec.grnIdx + d) % 5];
      totalAmount += qty * (Number(item.fobPrice) || 100);

      grnDetails.push({
        branchCode: "HQ",
        barcode: item.barcode,
        serialNo: d + 1,
        purchaseOrderNo: poNo,
        projectNo: pNo,
        model: item.modelNo,
        itemDescription: item.name,
        location: ["Warehouse A", "Warehouse B", "Receiving Bay"][d % 3],
        quantity: qty,
        unit: item.unit.unitCode,
      });
    }

    try {
      await prisma.grnMaster.create({
        data: {
          grnNo,
          branchCode: "HQ",
          grnDate: daysAgo(spec.daysBack),
          vendorInvoice: `VI-${1000 + spec.grnIdx}`,
          supplierId: supplier.id,
          purchaseOrderNo: poNo,
          description: `Goods received against ${poNo}`,
          totalAmount: round2(totalAmount),
          createdBy: "admin",
          details: {
            create: grnDetails,
          },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped GRN ${grnNo}: ${msg}`);
    }
  }
  console.log("  GRN records seeded (8)");

  // ═══════════════════════════════════════════════════════════════════
  // 9. GIN (6) - Goods Issue Notes
  // ═══════════════════════════════════════════════════════════════════
  const ginSpecs = [
    { ginIdx: 1, projectIdx: 0, daysBack: 20, detailCount: 3 },
    { ginIdx: 2, projectIdx: 1, daysBack: 22, detailCount: 4 },
    { ginIdx: 3, projectIdx: 2, daysBack: 28, detailCount: 3 },
    { ginIdx: 4, projectIdx: 0, daysBack: 15, detailCount: 5 },
    { ginIdx: 5, projectIdx: 3, daysBack: 10, detailCount: 3 },
    { ginIdx: 6, projectIdx: 4, daysBack: 8, detailCount: 4 },
  ];

  for (const spec of ginSpecs) {
    const ginNo = `GIN-${pad(spec.ginIdx)}`;

    const existing = await prisma.ginMaster.findUnique({ where: { ginNo } });
    if (existing) continue;

    const pNo = projectNoList[spec.projectIdx % projectNoList.length] ?? `PJ-${pad(spec.projectIdx + 1)}`;

    const ginDetails = [];
    let totalAmount = 0;
    for (let d = 0; d < spec.detailCount; d++) {
      const item = items[(spec.ginIdx * 3 + d) % items.length];
      const qty = [2, 5, 8, 3, 10][(spec.ginIdx + d) % 5];
      totalAmount += qty * (Number(item.fobPrice) || 100);

      ginDetails.push({
        branchCode: "HQ",
        barcode: item.barcode,
        serialNo: d + 1,
        projectNo: pNo,
        model: item.modelNo,
        itemDescription: item.name,
        location: ["Site Store", "Zone A", "Zone B", "Main Store"][d % 4],
        quantity: qty,
        unit: item.unit.unitCode,
      });
    }

    try {
      await prisma.ginMaster.create({
        data: {
          ginNo,
          branchCode: "HQ",
          ginDate: daysAgo(spec.daysBack),
          requestedBy: "Site Engineer",
          projectNo: pNo,
          description: `Material issued to ${pNo}`,
          totalAmount: round2(totalAmount),
          createdBy: "admin",
          details: {
            create: ginDetails,
          },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped GIN ${ginNo}: ${msg}`);
    }
  }
  console.log("  GIN records seeded (6)");

  // ═══════════════════════════════════════════════════════════════════
  // 10. GTN (4) - Goods Transfer Notes
  // ═══════════════════════════════════════════════════════════════════
  const gtnSpecs = [
    { gtnIdx: 1, fromProjIdx: 0, toProjIdx: 1, daysBack: 18, detailCount: 3 },
    { gtnIdx: 2, fromProjIdx: 1, toProjIdx: 2, daysBack: 25, detailCount: 4 },
    { gtnIdx: 3, fromProjIdx: 7, toProjIdx: 0, daysBack: 12, detailCount: 3 },
    { gtnIdx: 4, fromProjIdx: 2, toProjIdx: 3, daysBack: 8, detailCount: 2 },
  ];

  for (const spec of gtnSpecs) {
    const gtnNo = `GTN-${pad(spec.gtnIdx)}`;

    const existing = await prisma.gtnMaster.findUnique({ where: { gtnNo } });
    if (existing) continue;

    const fromPNo = projectNoList[spec.fromProjIdx % projectNoList.length] ?? `PJ-${pad(spec.fromProjIdx + 1)}`;
    const toPNo = projectNoList[spec.toProjIdx % projectNoList.length] ?? `PJ-${pad(spec.toProjIdx + 1)}`;

    const gtnDetails = [];
    let totalAmount = 0;
    for (let d = 0; d < spec.detailCount; d++) {
      const item = items[(spec.gtnIdx * 4 + d) % items.length];
      const qty = [3, 5, 2, 8][(spec.gtnIdx + d) % 4];
      totalAmount += qty * (Number(item.fobPrice) || 100);

      gtnDetails.push({
        branchCode: "HQ",
        barcode: item.barcode,
        serialNo: d + 1,
        model: item.modelNo,
        itemDescription: item.name,
        location: ["Warehouse A", "Warehouse B", "Site Store"][d % 3],
        quantity: qty,
        unit: item.unit.unitCode,
      });
    }

    try {
      await prisma.gtnMaster.create({
        data: {
          gtnNo,
          branchCode: "HQ",
          gtnDate: daysAgo(spec.daysBack),
          requestedBy: "Site Engineer",
          approvedBy: "PM",
          fromProjectNo: fromPNo,
          toProjectNo: toPNo,
          description: `Material transfer from ${fromPNo} to ${toPNo}`,
          totalAmount: round2(totalAmount),
          createdBy: "admin",
          details: {
            create: gtnDetails,
          },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped GTN ${gtnNo}: ${msg}`);
    }
  }
  console.log("  GTN records seeded (4)");

  // ═══════════════════════════════════════════════════════════════════
  // 11. GRRN (3) - Goods Return Notes
  // ═══════════════════════════════════════════════════════════════════
  const grrnSpecs = [
    { grrnIdx: 1, projectIdx: 0, daysBack: 14, detailCount: 3 },
    { grrnIdx: 2, projectIdx: 1, daysBack: 20, detailCount: 2 },
    { grrnIdx: 3, projectIdx: 7, daysBack: 10, detailCount: 4 },
  ];

  for (const spec of grrnSpecs) {
    const grrnNo = `GRRN-${pad(spec.grrnIdx)}`;

    const existing = await prisma.grrnMaster.findUnique({ where: { grrnNo } });
    if (existing) continue;

    const pNo = projectNoList[spec.projectIdx % projectNoList.length] ?? `PJ-${pad(spec.projectIdx + 1)}`;

    const grrnDetails = [];
    let totalAmount = 0;
    for (let d = 0; d < spec.detailCount; d++) {
      const item = items[(spec.grrnIdx * 5 + d) % items.length];
      const qty = [2, 3, 1, 5][(spec.grrnIdx + d) % 4];
      totalAmount += qty * (Number(item.fobPrice) || 100);

      grrnDetails.push({
        branchCode: "HQ",
        barcode: item.barcode,
        serialNo: d + 1,
        projectNo: pNo,
        model: item.modelNo,
        itemDescription: item.name,
        location: ["Return Bay", "Warehouse A", "Inspection Area"][d % 3],
        quantity: qty,
        unit: item.unit.unitCode,
      });
    }

    try {
      await prisma.grrnMaster.create({
        data: {
          grrnNo,
          branchCode: "HQ",
          grrnDate: daysAgo(spec.daysBack),
          returnedBy: "Store Keeper",
          projectNo: pNo,
          description: `Material returned from ${pNo}`,
          totalAmount: round2(totalAmount),
          createdBy: "admin",
          details: {
            create: grrnDetails,
          },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped GRRN ${grrnNo}: ${msg}`);
    }
  }
  console.log("  GRRN records seeded (3)");

  // ═══════════════════════════════════════════════════════════════════
  // 12. Physical Stock (30)
  // ═══════════════════════════════════════════════════════════════════
  const psStatuses = ["In Stock", "Issued", "Reserved"];
  const psStates = ["New", "Used"];
  const locations = ["Warehouse A", "Warehouse B", "Site Store", "Receiving Bay", "Main Store"];

  let psCount = 0;
  for (let ps = 1; ps <= 30; ps++) {
    const docNo = `PS-${pad(ps, 4)}`;

    // Check if docNo exists already (no unique constraint, use try/catch)
    const item = items[(ps - 1) % items.length];
    const projIdx = (ps - 1) % Math.max(projectNoList.length, 1);
    const pNo = projectNoList[projIdx] ?? `PJ-${pad(projIdx + 1)}`;
    const qty = [1, 2, 5, 10, 3, 8, 15, 4, 6, 20][ps % 10];
    const defFob = round2(Number(item.fobPrice) || 100 + ps * 10);
    const totDefFob = round2(qty * defFob);
    const convRate = 1;
    const fobAed = defFob;
    const totFobAed = totDefFob;
    const status = psStatuses[ps % 3];
    const state = psStates[ps % 2];

    try {
      await prisma.physicalStock.create({
        data: {
          branchCode: "HQ",
          docNo,
          docDate: daysAgo(ps * 2),
          projectNo: pNo,
          barcode: item.barcode,
          location: locations[ps % locations.length],
          serialNo: `SN-${10000 + ps}`,
          quantity: qty,
          psStatus: status,
          psState: state,
          autoGenerate: BigInt(ps),
          defFob,
          defCur: "AED",
          totDefFobAmount: totDefFob,
          convRate,
          fobPriceAed: fobAed,
          totFobPriceAed: totFobAed,
          isAccessories: ps % 5 === 0,
          landedCost: round2(defFob * 1.1),
          createdBy: "admin",
        },
      });
      psCount++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped PS ${docNo}: ${msg}`);
    }
  }
  console.log(`  Physical Stock seeded (${psCount})`);

  // ═══════════════════════════════════════════════════════════════════
  // 13. Financial Transactions (30)
  // ═══════════════════════════════════════════════════════════════════
  type TxnCategory = "INCOME" | "EXPENSE";

  const txnDescriptions = [
    "Payment received from client - Phase 1 milestone",
    "Material purchase payment - cables and accessories",
    "Subcontractor payment - electrical works",
    "Client advance payment",
    "Office rent payment - December 2025",
    "Utility bills - November 2025",
    "Insurance premium payment",
    "Material purchase - HVAC components",
    "Transportation charges - site delivery",
    "Petty cash replenishment",
    "Client payment - progress billing",
    "Supplier payment - switchgear",
    "License renewal payment",
    "Client retention release",
    "Salary advance - site team",
    "Equipment rental payment",
    "Client final payment",
    "Emergency material purchase",
    "Consultant fees payment",
    "Miscellaneous office expenses",
    "Client payment - variation order",
    "Supplier credit note adjustment",
    "Site equipment maintenance",
    "Communication expenses",
    "Travel and accommodation",
    "Client payment - retention",
    "PPE and safety equipment",
    "Workshop materials",
    "Fuel and transportation",
    "Year-end bonus accrual",
  ];

  const purposeCodes = purposes.length > 0
    ? purposes.map((p) => p.purposeCode)
    : ["MATPUR", "SUBPAY", "SAL", "RENT", "MISC"];
  const paymentTypeCodes = paymentTypes.length > 0
    ? paymentTypes.map((pt) => pt.paymentTypeCode)
    : ["CASH", "BT", "CHQ"];
  const paymentChannelCodes = paymentChannels.length > 0
    ? paymentChannels.map((pc) => pc.paymentChannelCode)
    : ["DIRECT", "ONLINE", "WIRE"];
  const bankCodes = banks.length > 0
    ? banks.map((b) => b.bankCode)
    : ["ENBD", "ADCB", "DIB"];
  const accountNos = bankAccounts.length > 0
    ? bankAccounts.map((ba) => ba.accountNo)
    : ["1001-AED-001", "2001-AED-001", "3001-AED-001"];

  let txnCount = 0;
  for (let t = 1; t <= 30; t++) {
    const txnNo = `TXN-${pad(t)}`;

    const existing = await prisma.financialTransaction.findUnique({
      where: { transactionNo: txnNo },
    });
    if (existing) continue;

    const category: TxnCategory = t <= 10 ? "INCOME" : "EXPENSE";
    const projIdx = (t - 1) % Math.max(projectNoList.length, 1);
    const pNo = projectNoList[projIdx] ?? `PJ-${pad(projIdx + 1)}`;

    const amount = round2([
      150000, 25000, 45000, 200000, 18000, 5500, 12000, 35000, 8500, 3000,
      120000, 42000, 7500, 85000, 15000, 22000, 175000, 9800, 30000, 4500,
      95000, 6700, 11000, 3200, 7800, 55000, 8900, 4200, 6100, 25000,
    ][t - 1]);

    const amountPaid = category === "INCOME" ? amount : round2(amount * 0.8);
    const amountLeft = round2(amount - amountPaid);
    const daysBack = t * 3;
    const isLocked = t === 5 || t === 15 || t === 25;
    const isArchived = t === 10 || t === 20;

    try {
      await prisma.financialTransaction.create({
        data: {
          transactionNo: txnNo,
          category,
          projectNo: pNo,
          purposeCode: purposeCodes[(t - 1) % purposeCodes.length],
          description: txnDescriptions[t - 1],
          paymentChannelCode: paymentChannelCodes[(t - 1) % paymentChannelCodes.length],
          bankCode: bankCodes[(t - 1) % bankCodes.length],
          accountNo: accountNos[(t - 1) % accountNos.length],
          paymentTypeCode: paymentTypeCodes[(t - 1) % paymentTypeCodes.length],
          currency: "AED",
          amount,
          amountPaid,
          amountLeft,
          expectedDate: daysAgo(daysBack + 5),
          actualDate: isLocked || isArchived ? daysAgo(daysBack) : null,
          isLocked,
          isArchived,
          branchCode: "HQ",
        },
      });
      txnCount++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped TXN ${txnNo}: ${msg}`);
    }
  }
  console.log(`  Financial Transactions seeded (${txnCount})`);

  // ═══════════════════════════════════════════════════════════════════
  // 14. Timesheets (60-80)
  // ═══════════════════════════════════════════════════════════════════
  if (accEmployees.length === 0 || accProjects.length === 0) {
    console.log("  Skipped Timesheets - no employees or acc-projects found");
  } else {
    let tsCount = 0;
    // Generate entries for last 30 days, 3-5 employees per day
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = daysAgo(dayOffset);
      // Pick 3 employees for weekdays (skip weekends roughly)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      const employeesPerDay = dayOffset % 3 === 0 ? 5 : dayOffset % 2 === 0 ? 4 : 3;

      for (let e = 0; e < employeesPerDay && e < accEmployees.length; e++) {
        const employee = accEmployees[e];
        const project = accProjects[(dayOffset + e) % accProjects.length];
        const position = accPositions.length > 0 ? accPositions[e % accPositions.length] : null;
        const department = accDepartments.length > 0 ? accDepartments[e % accDepartments.length] : null;
        const status = accStatuses.length > 0 ? accStatuses[0] : null; // Active
        const remark = accRemarks.length > 0 ? accRemarks[0] : null; // Present

        const extraHours = [0, 0, 2, 0, 4, 0, 1, 3][dayOffset % 8];
        const regularHours = 8;
        const totalHours = regularHours + extraHours;

        try {
          await prisma.accTimesheet.create({
            data: {
              date,
              employeeId: employee.id,
              projectId: project.id,
              positionId: position?.id ?? null,
              departmentId: department?.id ?? null,
              statusId: status?.id ?? null,
              regularHours,
              extraHours,
              totalHours,
              remarkId: remark?.id ?? null,
            },
          });
          tsCount++;
        } catch {
          // skip duplicate [date, employeeId, projectId]
        }
      }
    }
    console.log(`  Timesheets seeded (${tsCount})`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 15. CumulativeLpoDate (10)
  // ═══════════════════════════════════════════════════════════════════
  let lpoCount = 0;
  for (let c = 0; c < 10; c++) {
    const projIdx = c % Math.max(createdProjectIds.length, 1);
    if (projIdx >= createdProjectIds.length) break;
    const projectId = createdProjectIds[projIdx];
    const item = items[(c * 2) % items.length];

    try {
      await prisma.cumulativeLpoDate.create({
        data: {
          projectId,
          modelNo: item.modelNo.substring(0, 50),
          quantity: [10, 20, 15, 25, 30, 5, 12, 8, 40, 18][c],
          lpoDate: daysAgo(60 - c * 5),
          arrivalDate: daysAgo(30 - c * 3),
        },
      });
      lpoCount++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  Skipped CumulativeLpoDate ${c + 1}: ${msg}`);
    }
  }
  console.log(`  CumulativeLpoDate seeded (${lpoCount})`);

  console.log("Transactional data seeding complete!");
}
