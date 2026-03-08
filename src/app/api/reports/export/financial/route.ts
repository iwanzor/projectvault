import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../../_helpers";
import { financialReportSchema } from "@/lib/validators/reports";
import { getFinancialSummary } from "@/lib/services/report.service";
import { generateCsvExport } from "@/lib/services/export.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const params = financialReportSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");

  const report = await getFinancialSummary(params.data);

  const headers = ["Category", "Count", "Total Amount", "Total Paid", "Total Left"];
  const rows = [
    ["INCOME", report.income.count, Number(report.income.totalAmount ?? 0), Number(report.income.totalPaid ?? 0), Number(report.income.totalLeft ?? 0)],
    ["EXPENSE", report.expense.count, Number(report.expense.totalAmount ?? 0), Number(report.expense.totalPaid ?? 0), Number(report.expense.totalLeft ?? 0)],
  ];

  // Add by-purpose breakdown
  const purposeHeaders = ["Purpose Code", "Count", "Total Amount"];
  const purposeRows = report.byPurpose.map((p) => [
    p.purposeCode ?? "N/A",
    p._count,
    Number(p._sum.amount ?? 0),
  ]);

  const csv = generateCsvExport(headers, rows)
    + "\n\nBy Purpose\n"
    + generateCsvExport(purposeHeaders, purposeRows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=financial-report.csv",
    },
  });
});
