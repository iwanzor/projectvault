import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateBrandSchema } from "@/lib/validators/setup";
import { getBrandById, updateBrand, deleteBrand } from "@/lib/services/product-category.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const brand = await getBrandById(Number(params!.id));
  return NextResponse.json(brand);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateBrandSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const brand = await updateBrand(Number(params!.id), body.data);
  return NextResponse.json(brand);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteBrand(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
