import * as React from "react";
import { cn } from "@/lib/utils";

interface ReportSummaryCardProps {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function ReportSummaryCard({ icon: Icon, label, value, subtitle, className }: ReportSummaryCardProps) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-800 p-4", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-zinc-500" />}
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
