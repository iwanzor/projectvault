import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900",
  secondary: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
  destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  outline: "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
} as const;

type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
