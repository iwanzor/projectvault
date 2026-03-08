import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../../_helpers";
import { warehouseReportSchema } from "@/lib/validators/reports";
import { getWarehouseReport } from "@/lib/services/report.service";
import { generateCsvExport } from "@/lib/services/export.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const params = warehouseReportSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");

  const report = await getWarehouseReport(params.data);

  const headers = [
    "Transaction No", "Type", "Date", "Project No",
    "Supplier Code", "Description", "Line Items",
  ];

  const NATURE_LABELS: Record<number, string> = { 1: "GRN", 2: "GIN", 3: "GTN", 4: "GRRN" };

  const rows = report.transactions.map((t) => [
    t.transactionNo,
    NATURE_LABELS[t.nature] ?? `NATURE_${t.nature}`,
    t.transactionDate.toISOString().split("T")[0],
    t.projectNo,
    t.supplierCode,
    t.description ?? "",
    t._count.details,
  ]);

  const csv = generateCsvExport(headers, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=warehouse-report.csv",
    },
  });
});
