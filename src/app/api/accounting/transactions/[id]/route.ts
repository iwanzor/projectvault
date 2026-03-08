import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updateTransactionSchema } from "@/lib/validators/accounting";
import { getTransactionById, updateTransaction, deleteTransaction } from "@/lib/services/financial-transaction.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const txn = await getTransactionById(Number(params!.id));
  return NextResponse.json(txn);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updateTransactionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const txn = await updateTransaction(Number(params!.id), body.data);
  return NextResponse.json(txn);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deleteTransaction(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
