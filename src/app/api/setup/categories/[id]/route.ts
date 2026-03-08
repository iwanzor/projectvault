import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateMainCategorySchema } from "@/lib/validators/setup";
import { getMainCategoryById, updateMainCategory, deleteMainCategory } from "@/lib/services/product-category.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const category = await getMainCategoryById(Number(params!.id));
  return NextResponse.json(category);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateMainCategorySchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const category = await updateMainCategory(Number(params!.id), body.data);
  return NextResponse.json(category);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteMainCategory(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
