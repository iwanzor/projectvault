import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listTimesheetsSchema,
  createTimesheetSchema,
  updateTimesheetSchema,
  timesheetSummarySchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listTimesheetsSchema>;
type CreateData = z.infer<typeof createTimesheetSchema>;
type UpdateData = z.infer<typeof updateTimesheetSchema>;
type SummaryParams = z.infer<typeof timesheetSummarySchema>;

const timesheetIncludes = {
  employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  project: { select: { id: true, projectCode: true, name: true } },
  position: { select: { id: true, positionCode: true, name: true } },
  department: { select: { id: true, departmentCode: true, name: true } },
  status: { select: { id: true, statusCode: true, name: true } },
  remark: { select: { id: true, remarkCode: true, name: true } },
};

// ─── List ────────────────────────────────────────

export async function listTimesheets(params: ListParams) {
  const {
    page, pageSize, search, employeeId, projectId,
    departmentId, statusId, dateFrom, dateTo, sortBy, sortOrder,
  } = params;

  const where: Prisma.AccTimesheetWhereInput = {
    ...(employeeId ? { employeeId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(statusId ? { statusId } : {}),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { employee: { firstName: { contains: search } } },
            { employee: { lastName: { contains: search } } },
            { employee: { employeeCode: { contains: search } } },
            { project: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.accTimesheet.findMany({
      where,
      include: timesheetIncludes,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.accTimesheet.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ─── Get By ID ───────────────────────────────────

export async function getTimesheetById(id: number) {
  const ts = await prisma.accTimesheet.findUnique({
    where: { id },
    include: timesheetIncludes,
  });
  if (!ts) throw new NotFoundError("Timesheet not found");
  return ts;
}

// ─── Create ──────────────────────────────────────

export async function createTimesheet(data: CreateData) {
  try {
    return await prisma.accTimesheet.create({
      data,
      include: timesheetIncludes,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new AppError("Timesheet entry already exists for this date/employee/project", 409, "DUPLICATE");
      if (error.code === "P2003")
        throw new AppError("Invalid reference: check employee, project, or other IDs", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

// ─── Update ──────────────────────────────────────

export async function updateTimesheet(id: number, data: UpdateData) {
  try {
    return await prisma.accTimesheet.update({
      where: { id },
      data,
      include: timesheetIncludes,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new AppError("Timesheet entry already exists for this date/employee/project", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Timesheet not found");
      if (error.code === "P2003")
        throw new AppError("Invalid reference: check employee, project, or other IDs", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

// ─── Delete ──────────────────────────────────────

export async function deleteTimesheet(id: number) {
  try {
    return await prisma.accTimesheet.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Timesheet not found");
    throw error;
  }
}

// ─── Summary ─────────────────────────────────────

export async function getTimesheetSummary(params: SummaryParams) {
  const { dateFrom, dateTo } = params;
  const dateFilter: Prisma.AccTimesheetWhereInput = dateFrom || dateTo
    ? {
        date: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      }
    : {};

  const summary = await prisma.accTimesheet.groupBy({
    by: ["employeeId", "projectId"],
    where: dateFilter,
    _sum: {
      regularHours: true,
      extraHours: true,
      totalHours: true,
    },
    _count: true,
  });

  const employeeIds = [...new Set(summary.map((s) => s.employeeId))];
  const projectIds = [...new Set(summary.map((s) => s.projectId))];

  const [employees, projects] = await Promise.all([
    prisma.accEmployee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, employeeCode: true, firstName: true, lastName: true },
    }),
    prisma.accProject.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, projectCode: true, name: true },
    }),
  ]);

  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return summary.map((s) => ({
    employee: employeeMap.get(s.employeeId),
    project: projectMap.get(s.projectId),
    regularHours: s._sum.regularHours,
    extraHours: s._sum.extraHours,
    totalHours: s._sum.totalHours,
    count: s._count,
  }));
}
