import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema, createSubCategory2Schema } from "@/lib/validators/setup";
import { listSubCategories2, createSubCategory2 } from "@/lib/services/product-category.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const listSchema = listParamsSchema.extend({
  subCategory1Id: z.coerce.number().int().positive().optional(),
});

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listSubCategories2(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createSubCategory2Schema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const subCat = await createSubCategory2(body.data);
  return NextResponse.json(subCat, { status: 201 });
});
