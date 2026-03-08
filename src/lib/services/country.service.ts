import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NotFoundError, AppError } from "@/lib/errors";
import type { ListParams } from "@/lib/validators/setup";

// ─── Country ─────────────────────────────────────────

export async function listCountries(params: ListParams) {
  const { page, pageSize, search, sortBy, sortOrder } = params;
  const where: Prisma.CountryWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { countryCode: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.country.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.country.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getCountryById(id: number) {
  const country = await prisma.country.findUnique({
    where: { id },
    include: { cities: true },
  });
  if (!country) throw new NotFoundError("Country not found");
  return country;
}

export async function createCountry(data: { countryCode: string; name: string }) {
  try {
    return await prisma.country.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Country code already exists", 409, "DUPLICATE");
    }
    throw error;
  }
}

export async function updateCountry(id: number, data: { countryCode?: string; name?: string }) {
  try {
    return await prisma.country.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Country code already exists", 409, "DUPLICATE");
      if (error.code === "P2025") throw new NotFoundError("Country not found");
    }
    throw error;
  }
}

export async function deleteCountry(id: number) {
  const deps = await prisma.city.count({ where: { countryId: id } });
  if (deps > 0) throw new AppError("Cannot delete: country has associated cities", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.country.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError("Country not found");
    }
    throw error;
  }
}

// ─── City ────────────────────────────────────────────

export async function listCities(params: ListParams & { countryId?: number }) {
  const { page, pageSize, search, sortBy, sortOrder, countryId } = params;
  const where: Prisma.CityWhereInput = {
    ...(countryId ? { countryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { cityCode: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.city.findMany({
      where,
      include: { country: { select: { id: true, name: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.city.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getCityById(id: number) {
  const city = await prisma.city.findUnique({
    where: { id },
    include: { country: true, areas: true },
  });
  if (!city) throw new NotFoundError("City not found");
  return city;
}

export async function createCity(data: { cityCode: string; name: string; countryId: number }) {
  try {
    return await prisma.city.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("City code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Country not found", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateCity(id: number, data: { cityCode?: string; name?: string; countryId?: number }) {
  try {
    return await prisma.city.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("City code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("Country not found", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("City not found");
    }
    throw error;
  }
}

export async function deleteCity(id: number) {
  const deps = await prisma.area.count({ where: { cityId: id } });
  if (deps > 0) throw new AppError("Cannot delete: city has associated areas", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.city.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError("City not found");
    }
    throw error;
  }
}

// ─── Area ────────────────────────────────────────────

export async function listAreas(params: ListParams & { cityId?: number }) {
  const { page, pageSize, search, sortBy, sortOrder, cityId } = params;
  const where: Prisma.AreaWhereInput = {
    ...(cityId ? { cityId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { areaCode: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.area.findMany({
      where,
      include: { city: { select: { id: true, name: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.area.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getAreaById(id: number) {
  const area = await prisma.area.findUnique({
    where: { id },
    include: { city: { include: { country: true } } },
  });
  if (!area) throw new NotFoundError("Area not found");
  return area;
}

export async function createArea(data: { areaCode: string; name: string; cityId: number }) {
  try {
    return await prisma.area.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Area code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("City not found", 400, "INVALID_REFERENCE");
    }
    throw error;
  }
}

export async function updateArea(id: number, data: { areaCode?: string; name?: string; cityId?: number }) {
  try {
    return await prisma.area.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Area code already exists", 409, "DUPLICATE");
      if (error.code === "P2003") throw new AppError("City not found", 400, "INVALID_REFERENCE");
      if (error.code === "P2025") throw new NotFoundError("Area not found");
    }
    throw error;
  }
}

export async function deleteArea(id: number) {
  const [customers, suppliers] = await Promise.all([
    prisma.customer.count({ where: { areaId: id } }),
    prisma.supplier.count({ where: { areaId: id } }),
  ]);
  if (customers + suppliers > 0)
    throw new AppError("Cannot delete: area has associated customers or suppliers", 409, "HAS_DEPENDENCIES");
  try {
    return await prisma.area.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError("Area not found");
    }
    throw error;
  }
}
