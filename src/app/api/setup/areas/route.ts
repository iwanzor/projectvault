import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema, createAreaSchema } from "@/lib/validators/setup";
import { listAreas, createArea } from "@/lib/services/country.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const listAreasSchema = listParamsSchema.extend({
  cityId: z.coerce.number().int().positive().optional(),
});

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listAreasSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listAreas(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createAreaSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const area = await createArea(body.data);
  return NextResponse.json(area, { status: 201 });
});
