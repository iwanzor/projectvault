import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../_helpers";
import { financialReportSchema } from "@/lib/validators/reports";
import { getFinancialSummary } from "@/lib/services/report.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const params = financialReportSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await getFinancialSummary(params.data);
  return NextResponse.json(result);
});
