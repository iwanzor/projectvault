import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updatePhysicalStockSchema } from "@/lib/validators/warehouse";
import {
  getPhysicalStockById,
  updatePhysicalStock,
  deletePhysicalStock,
} from "@/lib/services/physical-stock.service";

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
  const stock = await getPhysicalStockById(Number(params!.id));
  return NextResponse.json(stock);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canEdit");
  const body = updatePhysicalStockSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const stock = await updatePhysicalStock(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(stock);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canDelete");
  await deletePhysicalStock(Number(params!.id));
  return NextResponse.json({
    message: "Physical stock record deleted successfully",
  });
});
