import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../../_helpers";
import { getFsfReport } from "@/lib/services/fsf.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const branchCode = req.nextUrl.searchParams.get("branchCode");
  if (!branchCode) throw new ValidationError("branchCode is required");
  const result = await getFsfReport(branchCode);
  return NextResponse.json(result);
});
