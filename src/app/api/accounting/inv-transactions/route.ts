import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { listInvTransactionsSchema, createInvTransactionSchema } from "@/lib/validators/accounting";
import { listInvTransactions, createInvTransaction } from "@/lib/services/inv-transaction.service";
import { checkAccountPermission } from "../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = listInvTransactionsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listInvTransactions(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "canAdd");
  const body = createInvTransactionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const txn = await createInvTransaction(body.data, session.user.username, session.user.branchCode);
  return NextResponse.json(txn, { status: 201 });
});
