import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../_helpers";
import { getDashboardMetrics } from "@/lib/services/report.service";

export const GET = apiHandler(async (_req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const result = await getDashboardMetrics();
  return NextResponse.json(result);
});
