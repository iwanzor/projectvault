import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema, createBrandSchema } from "@/lib/validators/setup";
import { listBrands, createBrand } from "@/lib/services/product-category.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listParamsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listBrands(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createBrandSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const brand = await createBrand(body.data);
  return NextResponse.json(brand, { status: 201 });
});
