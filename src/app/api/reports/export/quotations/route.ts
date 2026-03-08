import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../../_helpers";
import { sqReportSchema } from "@/lib/validators/reports";
import { getQuotationReport } from "@/lib/services/report.service";
import { generateCsvExport } from "@/lib/services/export.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const params = sqReportSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");

  const report = await getQuotationReport(params.data);

  const headers = [
    "Quotation No", "Date", "Customer", "Status", "Total Amount",
    "Net Amount", "VAT Amount", "Gross Total", "Line Items",
  ];
  const rows = report.details.map((q) => [
    q.quotationNo,
    q.quotationDate.toISOString().split("T")[0],
    q.customer?.name ?? "",
    q.status,
    Number(q.totalAmount),
    Number(q.netAmount),
    Number(q.vatAmount),
    Number(q.grossTotal),
    q._count.details,
  ]);

  const csv = generateCsvExport(headers, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=quotation-report.csv",
    },
  });
});
