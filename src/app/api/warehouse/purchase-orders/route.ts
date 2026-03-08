import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import {
  listPurchaseOrdersSchema,
  createPurchaseOrderSchema,
} from "@/lib/validators/warehouse";
import {
  listPurchaseOrders,
  createPurchaseOrder,
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

export const GET = apiHandler(async (req, { session }) => {
  checkWarehousePermission(session, "viewAll");
  const params = listPurchaseOrdersSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listPurchaseOrders(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkWarehousePermission(session, "canAdd");
  const body = createPurchaseOrderSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const po = await createPurchaseOrder(
    body.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(po, { status: 201 });
});
