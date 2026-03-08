import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { archiveTransactionSchema } from "@/lib/validators/accounting";
import { archiveTransaction } from "@/lib/services/financial-transaction.service";
import { checkAccountPermission } from "../../../_helpers";

export const POST = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = archiveTransactionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const txn = await archiveTransaction(Number(params!.id), body.data.descriptionArchive);
  return NextResponse.json(txn);
});
