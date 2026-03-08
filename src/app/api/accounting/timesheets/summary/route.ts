import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { timesheetSummarySchema } from "@/lib/validators/accounting";
import { getTimesheetSummary } from "@/lib/services/timesheet.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = timesheetSummarySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await getTimesheetSummary(params.data);
  return NextResponse.json(result);
});
