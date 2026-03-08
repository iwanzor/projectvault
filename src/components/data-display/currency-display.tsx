import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  className?: string;
  showSign?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = "AED",
  locale = "en-AE",
  className,
  showSign = false,
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const isNegative = amount < 0;
  const sign = isNegative ? "-" : showSign && amount > 0 ? "+" : "";

  return (
    <span
      className={cn(
        "tabular-nums",
        isNegative && "text-red-600 dark:text-red-400",
        className
      )}
    >
      {sign}
      {formatted}
    </span>
  );
}
