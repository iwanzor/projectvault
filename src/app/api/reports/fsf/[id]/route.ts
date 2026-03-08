import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../../_helpers";
import { fsfMasterSchema } from "@/lib/validators/reports";
import { getFsfMasterById, updateFsfMaster, deleteFsfMaster } from "@/lib/services/fsf.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (_req, { session, params }) => {
  checkReportsPermission(session, "viewAll");
  const id = Number(params!.id);
  if (isNaN(id)) throw new ValidationError("Invalid ID");
  const master = await getFsfMasterById(id);
  return NextResponse.json(master);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkReportsPermission(session, "canEdit");
  const id = Number(params!.id);
  if (isNaN(id)) throw new ValidationError("Invalid ID");
  const body = fsfMasterSchema.partial().safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const master = await updateFsfMaster(id, body.data);
  return NextResponse.json(master);
});

export const DELETE = apiHandler(async (_req, { session, params }) => {
  checkReportsPermission(session, "canDelete");
  const id = Number(params!.id);
  if (isNaN(id)) throw new ValidationError("Invalid ID");
  await deleteFsfMaster(id);
  return NextResponse.json({ message: "Deleted successfully" });
});
