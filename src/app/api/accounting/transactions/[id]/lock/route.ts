import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { lockTransactionSchema } from "@/lib/validators/accounting";
import { lockTransaction } from "@/lib/services/financial-transaction.service";
import { checkAccountPermission } from "../../../_helpers";

export const POST = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = lockTransactionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const txn = await lockTransaction(Number(params!.id), body.data.descriptionLock);
  return NextResponse.json(txn);
});
