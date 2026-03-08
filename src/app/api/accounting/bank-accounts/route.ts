import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { listBankAccountsSchema, createBankAccountSchema } from "@/lib/validators/accounting";
import { listBankAccounts, createBankAccount } from "@/lib/services/bank-account.service";
import { checkAccountPermission } from "../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = listBankAccountsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listBankAccounts(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "canAdd");
  const body = createBankAccountSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const account = await createBankAccount(body.data);
  return NextResponse.json(account, { status: 201 });
});
