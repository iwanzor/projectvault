import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError } from "@/lib/errors";
import { approvePurchaseOrder } from "@/lib/services/purchase-order.service";

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

export const POST = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canEdit");
  const po = await approvePurchaseOrder(
    Number(params!.id),
    session.user.username
  );
  return NextResponse.json(po);
});
