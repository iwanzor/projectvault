import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema, createCitySchema } from "@/lib/validators/setup";
import { listCities, createCity } from "@/lib/services/country.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const listCitiesSchema = listParamsSchema.extend({
  countryId: z.coerce.number().int().positive().optional(),
});

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listCitiesSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listCities(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createCitySchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const city = await createCity(body.data);
  return NextResponse.json(city, { status: 201 });
});
