import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updatePurposeSchema } from "@/lib/validators/accounting";
import { getPurposeById, updatePurpose, deletePurpose } from "@/lib/services/purpose.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const item = await getPurposeById(Number(params!.id));
  return NextResponse.json(item);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updatePurposeSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await updatePurpose(Number(params!.id), body.data);
  return NextResponse.json(item);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deletePurpose(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
