import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { listTransactionsSchema, createTransactionSchema } from "@/lib/validators/accounting";
import { listTransactions, createTransaction } from "@/lib/services/financial-transaction.service";
import { checkAccountPermission } from "../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = listTransactionsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listTransactions(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "canAdd");
  const body = createTransactionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const txn = await createTransaction(body.data);
  return NextResponse.json(txn, { status: 201 });
});
