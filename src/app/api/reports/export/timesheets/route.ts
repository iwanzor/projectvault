import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../../_helpers";
import { timesheetReportSchema } from "@/lib/validators/reports";
import { getTimesheetReport } from "@/lib/services/report.service";
import { generateCsvExport } from "@/lib/services/export.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const params = timesheetReportSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");

  const report = await getTimesheetReport(params.data);

  const headers = [
    "Employee Code", "Employee Name", "Regular Hours",
    "Extra Hours", "Total Hours", "Entries",
  ];
  const rows = report.byEmployee.map((e) => [
    e.employee?.employeeCode ?? "",
    e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : "",
    Number(e.regularHours ?? 0),
    Number(e.extraHours ?? 0),
    Number(e.totalHours ?? 0),
    e.count,
  ]);

  const csv = generateCsvExport(headers, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=timesheet-report.csv",
    },
  });
});
