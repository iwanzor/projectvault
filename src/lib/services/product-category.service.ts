import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

// ─── Brand ───────────────────────────────────────────

export async function listBrands(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.BrandWhereInput = search
    ? { OR: [{ name: { contains: search } }, { brandCode: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.brand.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.brand.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getBrandById(id: number) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw new NotFoundError("Brand not found");
  return brand;
}

export async function createBrand(data: { brandCode: string; name: string }) {
  try {
    return await prisma.brand.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Brand code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateBrand(id: number, data: { brandCode?: string; name?: string }) {
  try {
    return await prisma.brand.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Brand code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Brand not found");
    }
    throw error;
  }
}

export async function deleteBrand(id: number) {
  const deps = await prisma.item.count({ where: { brandId: id } });
  if (deps > 0) throw new AppError("Cannot delete: brand has associated items", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.brand.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Brand not found");
    throw error;
  }
}

// ─── MainCategory ────────────────────────────────────

export async function listMainCategories(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.MainCategoryWhereInput = search
    ? { OR: [{ name: { contains: search } }, { mainCategoryCode: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.mainCategory.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.mainCategory.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getMainCategoryById(id: number) {
  const cat = await prisma.mainCategory.findUnique({ where: { id }, include: { subCategories1: true } });
  if (!cat) throw new NotFoundError("Main category not found");
  return cat;
}

export async function createMainCategory(data: { mainCategoryCode: string; name: string }) {
  try {
    return await prisma.mainCategory.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AppError("Main category code already exists", 409, "DUPLICATE");
    throw error;
  }
}

export async function updateMainCategory(id: number, data: { mainCategoryCode?: string; name?: string }) {
  try {
    return await prisma.mainCategory.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Main category code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Main category not found");
    }
    throw error;
  }
}

export async function deleteMainCategory(id: number) {
  const deps = await prisma.subCategory1.count({ where: { mainCategoryId: id } });
  if (deps > 0) throw new AppError("Cannot delete: category has sub-categories", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.mainCategory.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Main category not found");
    throw error;
  }
}

// ─── SubCategory1 ────────────────────────────────────

export async function listSubCategories1(params: ListParams & { mainCategoryId?: number }) {
  const { page, pageSize, search, sortBy, sortOrder, mainCategoryId } = params;
  const where: Prisma.SubCategory1WhereInput = {
    ...(mainCategoryId ? { mainCategoryId } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { subCategory1Code: { contains: search } }] } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.subCategory1.findMany({
      where,
      include: { mainCategory: { select: { id: true, name: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subCategory1.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getSubCategory1ById(id: number) {
  const cat = await prisma.subCategory1.findUnique({
    where: { id },
    include: { mainCategory: true, subCategories2: true },
  });
  if (!cat) throw new NotFoundError("Sub-category 1 not found");
  return cat;
}

export async function createSubCategory1(data: { subCategory1Code: string; name: string; mainCategoryId: number }) {
  try {
    return await prisma.subCategory1.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Sub-category 1 code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Main category not found", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateSubCategory1(id: number, data: { subCategory1Code?: string; name?: string; mainCategoryId?: number }) {
  try {
    return await prisma.subCategory1.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Sub-category 1 code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Main category not found", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("Sub-category 1 not found");
    }
    throw error;
  }
}

export async function deleteSubCategory1(id: number) {
  const deps = await prisma.subCategory2.count({ where: { subCategory1Id: id } });
  if (deps > 0) throw new AppError("Cannot delete: has associated sub-categories", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.subCategory1.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Sub-category 1 not found");
    throw error;
  }
}

// ─── SubCategory2 ────────────────────────────────────

export async function listSubCategories2(params: ListParams & { subCategory1Id?: number }) {
  const { page, pageSize, search, sortBy, sortOrder, subCategory1Id } = params;
  const where: Prisma.SubCategory2WhereInput = {
    ...(subCategory1Id ? { subCategory1Id } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { subCategory2Code: { contains: search } }] } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.subCategory2.findMany({
      where,
      include: { subCategory1: { select: { id: true, name: true, mainCategory: { select: { id: true, name: true } } } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subCategory2.count({ where }),
  ]);
  return { data, total, page, pageSize };
}

export async function getSubCategory2ById(id: number) {
  const cat = await prisma.subCategory2.findUnique({
    where: { id },
    include: { subCategory1: { include: { mainCategory: true } } },
  });
  if (!cat) throw new NotFoundError("Sub-category 2 not found");
  return cat;
}

export async function createSubCategory2(data: { subCategory2Code: string; name: string; subCategory1Id: number }) {
  try {
    return await prisma.subCategory2.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Sub-category 2 code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Sub-category 1 not found", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateSubCategory2(id: number, data: { subCategory2Code?: string; name?: string; subCategory1Id?: number }) {
  try {
    return await prisma.subCategory2.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Sub-category 2 code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Sub-category 1 not found", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("Sub-category 2 not found");
    }
    throw error;
  }
}

export async function deleteSubCategory2(id: number) {
  const deps = await prisma.item.count({ where: { subCategory2Id: id } });
  if (deps > 0) throw new AppError("Cannot delete: has associated items", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.subCategory2.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new NotFoundError("Sub-category 2 not found");
    throw error;
  }
}
