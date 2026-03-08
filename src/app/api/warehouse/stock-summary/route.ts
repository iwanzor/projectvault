import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError } from "@/lib/errors";
import { getStockSummary } from "@/lib/services/physical-stock.service";

function checkWarehousePermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewAll: boolean; viewDetails: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewAll" | "viewDetails" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "WAREHOUSE");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session }) => {
  checkWarehousePermission(session, "viewAll");
  const summary = await getStockSummary();
  return NextResponse.json(summary);
});
