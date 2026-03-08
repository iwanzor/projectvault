import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema, createSubCategory1Schema } from "@/lib/validators/setup";
import { listSubCategories1, createSubCategory1 } from "@/lib/services/product-category.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const listSchema = listParamsSchema.extend({
  mainCategoryId: z.coerce.number().int().positive().optional(),
});

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listSubCategories1(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createSubCategory1Schema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const subCat = await createSubCategory1(body.data);
  return NextResponse.json(subCat, { status: 201 });
});
