import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateSubCategory1Schema } from "@/lib/validators/setup";
import { getSubCategory1ById, updateSubCategory1, deleteSubCategory1 } from "@/lib/services/product-category.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const subCat = await getSubCategory1ById(Number(params!.id));
  return NextResponse.json(subCat);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateSubCategory1Schema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const subCat = await updateSubCategory1(Number(params!.id), body.data);
  return NextResponse.json(subCat);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteSubCategory1(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
