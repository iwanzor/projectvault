import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updatePositionSchema } from "@/lib/validators/accounting";
import { getPositionById, updatePosition, deletePosition } from "@/lib/services/acc-position.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const item = await getPositionById(Number(params!.id));
  return NextResponse.json(item);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updatePositionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await updatePosition(Number(params!.id), body.data);
  return NextResponse.json(item);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deletePosition(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
