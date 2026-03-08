import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateGrnSchema } from "@/lib/validators/warehouse";
import {
  getGrnById,
  updateGrn,
  deleteGrn,
} from "@/lib/services/grn.service";

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
  const grn = await getGrnById(Number(params!.id));
  return NextResponse.json(grn);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canEdit");
  const body = updateGrnSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const grn = await updateGrn(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(grn);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canDelete");
  await deleteGrn(Number(params!.id));
  return NextResponse.json({ message: "GRN deleted successfully" });
});
