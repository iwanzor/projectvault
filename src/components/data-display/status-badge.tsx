import { Badge, type BadgeProps } from "@/components/ui/badge";

type StatusVariant = "success" | "warning" | "destructive" | "secondary" | "default";

interface StatusConfig {
  label: string;
  variant: StatusVariant;
}

const defaultStatusMap: Record<string, StatusConfig> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  draft: { label: "Draft", variant: "secondary" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  open: { label: "Open", variant: "success" },
  closed: { label: "Closed", variant: "secondary" },
};

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: string;
  statusMap?: Record<string, StatusConfig>;
}

export function StatusBadge({ status, statusMap, ...props }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="secondary" {...props}>
        -
      </Badge>
    );
  }
  
  const map = statusMap ?? defaultStatusMap;
  const config = map[status.toLowerCase()] ?? {
    label: status,
    variant: "secondary" as StatusVariant,
  };

  return (
    <Badge variant={config.variant} {...props}>
      {config.label}
    </Badge>
  );
}
