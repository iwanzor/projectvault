import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateUnitSchema } from "@/lib/validators/setup";
import { getUnitById, updateUnit, deleteUnit } from "@/lib/services/unit.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const unit = await getUnitById(Number(params!.id));
  return NextResponse.json(unit);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateUnitSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const unit = await updateUnit(Number(params!.id), body.data);
  return NextResponse.json(unit);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteUnit(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
