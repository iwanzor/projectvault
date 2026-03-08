import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listEmployeesSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listEmployeesSchema>;
type CreateData = z.infer<typeof createEmployeeSchema>;
type UpdateData = z.infer<typeof updateEmployeeSchema>;

export async function listEmployees(params: ListParams) {
  const { page, pageSize, search, isActive, sortBy, sortOrder } = params;
  const where: Prisma.AccEmployeeWhereInput = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { employeeCode: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { nickName: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.accEmployee.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.accEmployee.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getEmployeeById(id: number) {
  const emp = await prisma.accEmployee.findUnique({ where: { id } });
  if (!emp) throw new NotFoundError("Employee not found");
  return emp;
}

export async function createEmployee(data: CreateData) {
  try {
    return await prisma.accEmployee.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Employee code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateEmployee(id: number, data: UpdateData) {
  try {
    return await prisma.accEmployee.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Employee code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Employee not found");
    }
    throw error;
  }
}

export async function deleteEmployee(id: number) {
  const deps = await prisma.accTimesheet.count({ where: { employeeId: id } });
  if (deps > 0) throw new AppError("Cannot delete: employee has associated timesheets", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.accEmployee.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Employee not found");
    throw error;
  }
}
