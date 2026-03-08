import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updatePaymentTypeSchema } from "@/lib/validators/accounting";
import { getPaymentTypeById, updatePaymentType, deletePaymentType } from "@/lib/services/payment-type.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const item = await getPaymentTypeById(Number(params!.id));
  return NextResponse.json(item);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updatePaymentTypeSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await updatePaymentType(Number(params!.id), body.data);
  return NextResponse.json(item);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deletePaymentType(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
