import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updateBankSchema } from "@/lib/validators/accounting";
import { getBankById, updateBank, deleteBank } from "@/lib/services/bank.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const bank = await getBankById(Number(params!.id));
  return NextResponse.json(bank);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updateBankSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const bank = await updateBank(Number(params!.id), body.data);
  return NextResponse.json(bank);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deleteBank(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
