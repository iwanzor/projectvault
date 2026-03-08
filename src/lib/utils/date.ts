import { format, parseISO, isValid } from "date-fns";

export function formatDate(date: string | Date | null | undefined, formatStr: string = "dd/MM/yyyy"): string {
  if (!date) return "-";
  
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "-";
    return format(d, formatStr);
  } catch {
    return "-";
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}
