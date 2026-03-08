import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateVatRateSchema } from "@/lib/validators/setup";
import { getVatRateById, updateVatRate, deleteVatRate } from "@/lib/services/vat.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const vat = await getVatRateById(Number(params!.id));
  return NextResponse.json(vat);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateVatRateSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const vat = await updateVatRate(Number(params!.id), body.data);
  return NextResponse.json(vat);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteVatRate(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
