import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { z } from "zod/v4";
import type {
  listAccProjectsSchema,
  createAccProjectSchema,
  updateAccProjectSchema,
} from "@/lib/validators/accounting";

type ListParams = z.infer<typeof listAccProjectsSchema>;
type CreateData = z.infer<typeof createAccProjectSchema>;
type UpdateData = z.infer<typeof updateAccProjectSchema>;

export async function listAccProjects(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.AccProjectWhereInput = search
    ? { OR: [{ projectCode: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.accProject.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.accProject.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getAccProjectById(id: number) {
  const item = await prisma.accProject.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Project not found");
  return item;
}

export async function createAccProject(data: CreateData) {
  try {
    return await prisma.accProject.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Project code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateAccProject(id: number, data: UpdateData) {
  try {
    return await prisma.accProject.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Project code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Project not found");
    }
    throw error;
  }
}

export async function deleteAccProject(id: number) {
  try {
    return await prisma.accProject.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Project not found");
    throw error;
  }
}
