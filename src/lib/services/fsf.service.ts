import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  fsfMasterSchema,
  listFsfSchema,
} from "@/lib/validators/reports";

type CreateData = z.infer<typeof fsfMasterSchema>;
type ListParams = z.infer<typeof listFsfSchema>;

// ─── List FSF Masters ───────────────────────────────

export async function listFsfMasters(params: ListParams) {
  const { page, pageSize, branchCode, type, fsfCategory } = params;

  const where: Prisma.FsfMasterWhereInput = {
    ...(branchCode ? { branchCode } : {}),
    ...(type ? { type } : {}),
    ...(fsfCategory ? { fsfCategory } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.fsfMaster.findMany({
      where,
      include: { details: true },
      orderBy: { serial: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.fsfMaster.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get FSF Master By ID ───────────────────────────

export async function getFsfMasterById(id: number) {
  const master = await prisma.fsfMaster.findUnique({
    where: { id },
    include: { details: { orderBy: { serial: "asc" } } },
  });
  if (!master) throw new NotFoundError("FSF Master not found");
  return master;
}

// ─── Create FSF Master ──────────────────────────────

export async function createFsfMaster(data: CreateData) {
  return prisma.fsfMaster.create({
    data: {
      branchCode: data.branchCode,
      note: data.note,
      description: data.description,
      type: data.type,
      reportMode: data.reportMode,
      nature: data.nature,
      nGroup: data.nGroup,
      serial: data.serial,
      fsfCategory: data.fsfCategory,
      amount: data.amount ?? null,
    },
    include: { details: true },
  });
}

// ─── Update FSF Master ──────────────────────────────

export async function updateFsfMaster(id: number, data: Partial<CreateData>) {
  const existing = await prisma.fsfMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("FSF Master not found");

  return prisma.fsfMaster.update({
    where: { id },
    data: {
      ...(data.branchCode !== undefined ? { branchCode: data.branchCode } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.reportMode !== undefined ? { reportMode: data.reportMode } : {}),
      ...(data.nature !== undefined ? { nature: data.nature } : {}),
      ...(data.nGroup !== undefined ? { nGroup: data.nGroup } : {}),
      ...(data.serial !== undefined ? { serial: data.serial } : {}),
      ...(data.fsfCategory !== undefined ? { fsfCategory: data.fsfCategory } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
    },
    include: { details: true },
  });
}

// ─── Delete FSF Master ──────────────────────────────

export async function deleteFsfMaster(id: number) {
  const existing = await prisma.fsfMaster.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("FSF Master not found");

  // Cascade delete is handled by Prisma schema (onDelete: Cascade)
  return prisma.fsfMaster.delete({ where: { id } });
}

// ─── FSF Report ─────────────────────────────────────

export async function getFsfReport(branchCode: string) {
  const masters = await prisma.fsfMaster.findMany({
    where: { branchCode },
    include: { details: { orderBy: { serial: "asc" } } },
    orderBy: { serial: "asc" },
  });

  // Group by fsfCategory for the report
  const byCategory = new Map<string, typeof masters>();
  for (const m of masters) {
    const existing = byCategory.get(m.fsfCategory) ?? [];
    existing.push(m);
    byCategory.set(m.fsfCategory, existing);
  }

  return {
    branchCode,
    categories: Array.from(byCategory.entries()).map(([category, items]) => ({
      category,
      items,
      totalAmount: items.reduce((sum, m) => sum + Number(m.amount ?? 0), 0),
    })),
    totalMasters: masters.length,
  };
}
