import type { Session } from "next-auth";
import { ForbiddenError } from "@/lib/errors";

export function checkSetupPermission(
  session: Session,
  action: "viewAll" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "SETUP");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}
