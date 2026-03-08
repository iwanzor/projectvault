import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateSupplierSchema } from "@/lib/validators/supplier";
import { getSupplierById, updateSupplier, deleteSupplier } from "@/lib/services/supplier.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const supplier = await getSupplierById(Number(params!.id));
  return NextResponse.json(supplier);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateSupplierSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const supplier = await updateSupplier(Number(params!.id), body.data);
  return NextResponse.json(supplier);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteSupplier(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
