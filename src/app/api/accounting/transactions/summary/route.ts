import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { transactionSummarySchema } from "@/lib/validators/accounting";
import { getSummary } from "@/lib/services/financial-transaction.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = transactionSummarySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await getSummary(params.data);
  return NextResponse.json(result);
});
