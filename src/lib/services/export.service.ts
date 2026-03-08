// ─── CSV Export Utility ─────────────────────────────

export function generateCsvExport(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escapeCsvField = (field: string | number | null | undefined): string => {
    if (field === null || field === undefined) return "";
    const str = String(field);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));

  return [headerLine, ...dataLines].join("\n");
}
