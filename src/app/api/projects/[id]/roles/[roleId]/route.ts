import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError } from "@/lib/errors";
import { removeRole } from "@/lib/services/project.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; canEdit: boolean }[] } },
  action: "canEdit"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  await removeRole(Number(params!.roleId));
  return NextResponse.json({ message: "Role removed successfully" });
});
