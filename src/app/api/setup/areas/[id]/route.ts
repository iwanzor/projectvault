import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateAreaSchema } from "@/lib/validators/setup";
import { getAreaById, updateArea, deleteArea } from "@/lib/services/country.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const area = await getAreaById(Number(params!.id));
  return NextResponse.json(area);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateAreaSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const area = await updateArea(Number(params!.id), body.data);
  return NextResponse.json(area);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteArea(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
