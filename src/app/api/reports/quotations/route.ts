import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../_helpers";
import { sqReportSchema } from "@/lib/validators/reports";
import { getQuotationReport } from "@/lib/services/report.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const params = sqReportSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await getQuotationReport(params.data);
  return NextResponse.json(result);
});
