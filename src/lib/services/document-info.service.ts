import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

export async function listDocumentInfos(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.DocumentInfoWhereInput = search
    ? { OR: [{ description: { contains: search } }, { documentCode: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.documentInfo.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.documentInfo.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getDocumentInfoById(id: number) {
  const doc = await prisma.documentInfo.findUnique({ where: { id } });
  if (!doc) throw new NotFoundError("Document info not found");
  return doc;
}

export async function createDocumentInfo(data: { documentCode: string; description: string }) {
  try {
    return await prisma.documentInfo.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Document code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateDocumentInfo(id: number, data: { documentCode?: string; description?: string }) {
  try {
    return await prisma.documentInfo.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Document code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Document info not found");
    }
    throw error;
  }
}

export async function deleteDocumentInfo(id: number) {
  const deps = await prisma.projectDocumentDetail.count({ where: { documentId: id } });
  if (deps > 0) throw new AppError("Cannot delete: document is used in projects", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.documentInfo.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Document info not found");
    throw error;
  }
}
