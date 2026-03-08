import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { z } from "zod/v4";
import type {
  sqReportSchema,
  currencyReportSchema,
  projectReportSchema,
  financialReportSchema,
  warehouseReportSchema,
  timesheetReportSchema,
  activityLogSchema,
} from "@/lib/validators/reports";

type SQReportParams = z.infer<typeof sqReportSchema>;
type CurrencyReportParams = z.infer<typeof currencyReportSchema>;
type ProjectReportParams = z.infer<typeof projectReportSchema>;
type FinancialReportParams = z.infer<typeof financialReportSchema>;
type WarehouseReportParams = z.infer<typeof warehouseReportSchema>;
type TimesheetReportParams = z.infer<typeof timesheetReportSchema>;
type ActivityLogParams = z.infer<typeof activityLogSchema>;

// ─── Quotation Report ───────────────────────────────

export async function getQuotationReport(params: SQReportParams) {
  const { from, to, status, customerId, sortBy, sortOrder } = params;

  const where: Prisma.SalesQuotationMasterWhereInput = {
    isArchived: false,
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
    ...(from || to
      ? {
          quotationDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [byStatus, byCustomer, totals, details] = await Promise.all([
    prisma.salesQuotationMaster.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: { grossTotal: true },
    }),
    prisma.salesQuotationMaster.groupBy({
      by: ["customerId"],
      where,
      _count: true,
      _sum: { grossTotal: true },
    }),
    prisma.salesQuotationMaster.aggregate({
      where,
      _count: true,
      _sum: { totalAmount: true, netAmount: true, vatAmount: true, grossTotal: true },
    }),
    prisma.salesQuotationMaster.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        _count: { select: { details: true } },
      },
      orderBy: { [sortBy]: sortOrder },
    }),
  ]);

  // Resolve customer names for byCustomer breakdown
  const customerIds = byCustomer.map((c) => c.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, customerCode: true },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return {
    summary: {
      totalCount: totals._count,
      totalAmount: totals._sum.totalAmount,
      netAmount: totals._sum.netAmount,
      vatAmount: totals._sum.vatAmount,
      grossTotal: totals._sum.grossTotal,
    },
    byStatus,
    byCustomer: byCustomer.map((c) => ({
      customer: customerMap.get(c.customerId),
      count: c._count,
      grossTotal: c._sum.grossTotal,
    })),
    details,
  };
}

// ─── Currency Report ────────────────────────────────

export async function getCurrencyReport(params: CurrencyReportParams) {
  const { from, to, currencyCode } = params;

  const where: Prisma.SalesQuotationDetailWhereInput = {
    ...(currencyCode ? { exchangeRate: { not: null } } : {}),
    ...(from || to
      ? {
          quotation: {
            quotationDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          },
        }
      : {}),
  };

  const details = await prisma.salesQuotationDetail.findMany({
    where,
    select: {
      exchangeRate: true,
      amount: true,
      fobPrice: true,
      landedCost: true,
      quotation: {
        select: {
          id: true,
          quotationNo: true,
          quotationDate: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Group by exchange rate (as a proxy for currency)
  const byCurrency = new Map<string, { count: number; totalAmount: number; totalFob: number }>();
  for (const d of details) {
    const key = d.exchangeRate?.toString() ?? "base";
    const existing = byCurrency.get(key) ?? { count: 0, totalAmount: 0, totalFob: 0 };
    existing.count += 1;
    existing.totalAmount += Number(d.amount);
    existing.totalFob += Number(d.fobPrice);
    byCurrency.set(key, existing);
  }

  return {
    byCurrency: Array.from(byCurrency.entries()).map(([rate, data]) => ({
      exchangeRate: rate,
      ...data,
    })),
    details,
  };
}

// ─── Project Report ─────────────────────────────────

export async function getProjectReport(params: ProjectReportParams) {
  const { from, to, status, sortBy, sortOrder } = params;

  const where: Prisma.ProjectMasterWhereInput = {
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          projectDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [byStatus, totals, details] = await Promise.all([
    prisma.projectMaster.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: { grossTotal: true, netAmount: true },
    }),
    prisma.projectMaster.aggregate({
      where,
      _count: true,
      _sum: { totalAmount: true, netAmount: true, vatAmount: true, grossTotal: true },
    }),
    prisma.projectMaster.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        _count: { select: { details: true, roles: true } },
      },
      orderBy: { [sortBy]: sortOrder },
    }),
  ]);

  return {
    summary: {
      totalCount: totals._count,
      totalAmount: totals._sum.totalAmount,
      netAmount: totals._sum.netAmount,
      vatAmount: totals._sum.vatAmount,
      grossTotal: totals._sum.grossTotal,
    },
    byStatus,
    details,
  };
}

// ─── Financial Summary ──────────────────────────────

export async function getFinancialSummary(params: FinancialReportParams) {
  const { from, to, category, projectNo } = params;

  const where: Prisma.FinancialTransactionWhereInput = {
    ...(category ? { category } : {}),
    ...(projectNo ? { projectNo } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [income, expense, byPurpose, byProject, byMonth] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { ...where, category: "INCOME" },
      _sum: { amount: true, amountPaid: true, amountLeft: true },
      _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: { ...where, category: "EXPENSE" },
      _sum: { amount: true, amountPaid: true, amountLeft: true },
      _count: true,
    }),
    prisma.financialTransaction.groupBy({
      by: ["purposeCode"],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialTransaction.groupBy({
      by: ["projectNo"],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialTransaction.groupBy({
      by: ["category"],
      where,
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  return {
    income: {
      count: income._count,
      totalAmount: income._sum.amount,
      totalPaid: income._sum.amountPaid,
      totalLeft: income._sum.amountLeft,
    },
    expense: {
      count: expense._count,
      totalAmount: expense._sum.amount,
      totalPaid: expense._sum.amountPaid,
      totalLeft: expense._sum.amountLeft,
    },
    byPurpose,
    byProject: byProject.filter((p) => p.projectNo !== null),
    byCategory: byMonth,
  };
}

// ─── Warehouse Report ───────────────────────────────

const NATURE_MAP: Record<string, number> = {
  GRN: 1,
  GIN: 2,
  GTN: 3,
  GRRN: 4,
};

export async function getWarehouseReport(params: WarehouseReportParams) {
  const { from, to, projectNo, type } = params;

  const where: Prisma.InvTransactionMasterWhereInput = {
    ...(projectNo ? { projectNo } : {}),
    ...(type ? { nature: NATURE_MAP[type] } : {}),
    ...(from || to
      ? {
          transactionDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [byNature, transactions] = await Promise.all([
    prisma.invTransactionMaster.groupBy({
      by: ["nature"],
      where,
      _count: true,
    }),
    prisma.invTransactionMaster.findMany({
      where,
      include: {
        _count: { select: { details: true } },
      },
      orderBy: { transactionDate: "desc" },
    }),
  ]);

  const NATURE_LABELS: Record<number, string> = { 1: "GRN", 2: "GIN", 3: "GTN", 4: "GRRN" };

  return {
    summary: byNature.map((n) => ({
      type: NATURE_LABELS[n.nature] ?? `NATURE_${n.nature}`,
      count: n._count,
    })),
    transactions,
  };
}

// ─── Timesheet Report ───────────────────────────────

export async function getTimesheetReport(params: TimesheetReportParams) {
  const { from, to, employeeId, projectId, departmentId } = params;

  const where: Prisma.AccTimesheetWhereInput = {
    ...(employeeId ? { employeeId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [byEmployee, byProject, byDepartment, totals] = await Promise.all([
    prisma.accTimesheet.groupBy({
      by: ["employeeId"],
      where,
      _sum: { regularHours: true, extraHours: true, totalHours: true },
      _count: true,
    }),
    prisma.accTimesheet.groupBy({
      by: ["projectId"],
      where,
      _sum: { regularHours: true, extraHours: true, totalHours: true },
      _count: true,
    }),
    prisma.accTimesheet.groupBy({
      by: ["departmentId"],
      where,
      _sum: { regularHours: true, extraHours: true, totalHours: true },
      _count: true,
    }),
    prisma.accTimesheet.aggregate({
      where,
      _sum: { regularHours: true, extraHours: true, totalHours: true },
      _count: true,
    }),
  ]);

  // Resolve names
  const employeeIds = byEmployee.map((e) => e.employeeId);
  const projectIds = byProject.map((p) => p.projectId);
  const departmentIds = byDepartment.map((d) => d.departmentId).filter((id): id is number => id !== null);

  const [employees, projects, departments] = await Promise.all([
    prisma.accEmployee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, employeeCode: true, firstName: true, lastName: true },
    }),
    prisma.accProject.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, projectCode: true, name: true },
    }),
    departmentIds.length > 0
      ? prisma.accDepartment.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, departmentCode: true, name: true },
        })
      : [],
  ]);

  const empMap = new Map(employees.map((e) => [e.id, e]));
  const projMap = new Map(projects.map((p) => [p.id, p]));
  const deptMap = new Map(departments.map((d) => [d.id, d]));

  return {
    summary: {
      totalEntries: totals._count,
      totalRegularHours: totals._sum.regularHours,
      totalExtraHours: totals._sum.extraHours,
      totalHours: totals._sum.totalHours,
    },
    byEmployee: byEmployee.map((e) => ({
      employee: empMap.get(e.employeeId),
      ...e._sum,
      count: e._count,
    })),
    byProject: byProject.map((p) => ({
      project: projMap.get(p.projectId),
      ...p._sum,
      count: p._count,
    })),
    byDepartment: byDepartment
      .filter((d) => d.departmentId !== null)
      .map((d) => ({
        department: deptMap.get(d.departmentId!),
        ...d._sum,
        count: d._count,
      })),
  };
}

// ─── Dashboard Metrics ──────────────────────────────

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    quotationsThisMonth,
    quotationsThisYear,
    activeProjects,
    totalTransactions,
    incomeTotal,
    expenseTotal,
    stockCount,
    timesheetEntries,
  ] = await Promise.all([
    prisma.salesQuotationMaster.count({
      where: { quotationDate: { gte: startOfMonth }, isArchived: false },
    }),
    prisma.salesQuotationMaster.count({
      where: { quotationDate: { gte: startOfYear }, isArchived: false },
    }),
    prisma.projectMaster.count({ where: { status: "ACTIVE" } }),
    prisma.financialTransaction.count(),
    prisma.financialTransaction.aggregate({
      where: { category: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { category: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.physicalStock.aggregate({
      _sum: { totFobPriceAed: true },
      _count: true,
    }),
    prisma.accTimesheet.count({
      where: { date: { gte: startOfMonth } },
    }),
  ]);

  return {
    quotationsThisMonth,
    quotationsThisYear,
    activeProjects,
    totalTransactions,
    totalIncome: incomeTotal._sum.amount,
    totalExpense: expenseTotal._sum.amount,
    stockValue: stockCount._sum.totFobPriceAed,
    stockRecords: stockCount._count,
    timesheetEntriesThisMonth: timesheetEntries,
  };
}

// ─── Activity Log ───────────────────────────────────

export async function getActivityLog(params: ActivityLogParams) {
  const { from, to, page, pageSize } = params;

  const dateFilter = from || to
    ? {
        createdAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      }
    : {};

  // Aggregate recent operations from multiple tables
  const [quotations, projects, transactions, purchaseOrders] = await Promise.all([
    prisma.salesQuotationMaster.findMany({
      where: { ...dateFilter },
      select: {
        id: true,
        quotationNo: true,
        status: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: pageSize,
    }),
    prisma.projectMaster.findMany({
      where: { ...dateFilter },
      select: {
        id: true,
        projectNo: true,
        projectName: true,
        status: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: pageSize,
    }),
    prisma.financialTransaction.findMany({
      where: { ...dateFilter },
      select: {
        id: true,
        transactionNo: true,
        category: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: pageSize,
    }),
    prisma.purchaseOrderMaster.findMany({
      where: {
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        purchaseOrderNo: true,
        status: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: pageSize,
    }),
  ]);

  // Combine into unified activity entries
  type ActivityEntry = { module: string; type: string; refNo: string; user: string | null; date: Date; details: string };
  const activities: ActivityEntry[] = [];

  for (const q of quotations) {
    activities.push({
      module: "SALES",
      type: "Quotation",
      refNo: q.quotationNo,
      user: q.updatedBy ?? q.createdBy,
      date: q.updatedAt,
      details: `Status: ${q.status}`,
    });
  }
  for (const p of projects) {
    activities.push({
      module: "PROJECT",
      type: "Project",
      refNo: p.projectNo,
      user: p.updatedBy ?? p.createdBy,
      date: p.updatedAt,
      details: `${p.projectName} - Status: ${p.status}`,
    });
  }
  for (const t of transactions) {
    activities.push({
      module: "ACCOUNT",
      type: "Transaction",
      refNo: t.transactionNo,
      user: null,
      date: t.updatedAt,
      details: `${t.category} - Amount: ${t.amount}`,
    });
  }
  for (const po of purchaseOrders) {
    activities.push({
      module: "WAREHOUSE",
      type: "PurchaseOrder",
      refNo: po.purchaseOrderNo,
      user: po.updatedBy ?? po.createdBy,
      date: po.updatedAt,
      details: `Status: ${po.status}`,
    });
  }

  // Sort by date descending and paginate
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const total = activities.length;
  const start = (page - 1) * pageSize;
  const data = activities.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}
