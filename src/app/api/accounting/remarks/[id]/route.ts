import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updateRemarkSchema } from "@/lib/validators/accounting";
import { getRemarkById, updateRemark, deleteRemark } from "@/lib/services/acc-remark.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const item = await getRemarkById(Number(params!.id));
  return NextResponse.json(item);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updateRemarkSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await updateRemark(Number(params!.id), body.data);
  return NextResponse.json(item);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deleteRemark(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
