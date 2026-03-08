import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updateInvTransactionSchema } from "@/lib/validators/accounting";
import { getInvTransactionById, updateInvTransaction, deleteInvTransaction } from "@/lib/services/inv-transaction.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const txn = await getInvTransactionById(Number(params!.id));
  return NextResponse.json(txn);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updateInvTransactionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const txn = await updateInvTransaction(Number(params!.id), body.data, session.user.username);
  return NextResponse.json(txn);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deleteInvTransaction(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
