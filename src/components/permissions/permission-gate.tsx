"use client";

import { useSession } from "next-auth/react";

type Module = "SETUP" | "SALES" | "ACCOUNT" | "PROJECT" | "WAREHOUSE" | "REPORTS";
type Action = "viewAll" | "viewDetails" | "add" | "edit" | "delete";

const actionToPrivilegeKey: Record<Action, string> = {
  viewAll: "viewAll",
  viewDetails: "viewDetails",
  add: "canAdd",
  edit: "canEdit",
  delete: "canDelete",
};

interface PermissionGateProps {
  module: Module;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { data: session } = useSession();

  if (!session?.user) return <>{fallback}</>;

  const user = session.user as {
    role?: string;
    privileges?: Array<{
      module: string;
      viewAll: boolean;
      viewDetails: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }>;
  };

  // Admin bypasses all permission checks
  if (user.role === "ADMIN") return <>{children}</>;

  const privileges = user.privileges;
  if (!privileges) return <>{fallback}</>;

  const modulePrivilege = privileges.find((p) => p.module === module);
  if (!modulePrivilege) return <>{fallback}</>;

  const key = actionToPrivilegeKey[action] as keyof typeof modulePrivilege;
  if (modulePrivilege[key]) return <>{children}</>;

  return <>{fallback}</>;
}

export function useHasPermission(module: Module, action: Action): boolean {
  const { data: session } = useSession();

  if (!session?.user) return false;

  const user = session.user as {
    role?: string;
    privileges?: Array<{
      module: string;
      viewAll: boolean;
      viewDetails: boolean;
      canAdd: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }>;
  };

  if (user.role === "ADMIN") return true;

  const privileges = user.privileges;
  if (!privileges) return false;

  const modulePrivilege = privileges.find((p) => p.module === module);
  if (!modulePrivilege) return false;

  const key = actionToPrivilegeKey[action] as keyof typeof modulePrivilege;
  return !!modulePrivilege[key];
}

export type { Module, Action };
