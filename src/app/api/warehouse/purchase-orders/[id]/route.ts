import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updatePurchaseOrderSchema } from "@/lib/validators/warehouse";
import {
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "@/lib/services/purchase-order.service";

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

export const GET = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "viewDetails");
  const po = await getPurchaseOrderById(Number(params!.id));
  return NextResponse.json(po);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canEdit");
  const body = updatePurchaseOrderSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const po = await updatePurchaseOrder(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(po);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canDelete");
  await deletePurchaseOrder(Number(params!.id));
  return NextResponse.json({ message: "Purchase order deleted successfully" });
});
