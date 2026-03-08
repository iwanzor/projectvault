import { ForbiddenError } from "@/lib/errors";

export function checkReportsPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewAll: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewAll" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "REPORTS");
  if (!perm || !perm[action]) throw new ForbiddenError("Insufficient permissions");
}
