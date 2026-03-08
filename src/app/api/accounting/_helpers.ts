import { ForbiddenError } from "@/lib/errors";

export function checkAccountPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewAll: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewAll" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "ACCOUNT");
  if (!perm || !perm[action]) throw new ForbiddenError("Insufficient permissions");
}
