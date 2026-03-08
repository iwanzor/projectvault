import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateGinSchema } from "@/lib/validators/warehouse";
import {
  getGinById,
  updateGin,
  deleteGin,
} from "@/lib/services/gin.service";

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
  const gin = await getGinById(Number(params!.id));
  return NextResponse.json(gin);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canEdit");
  const body = updateGinSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const gin = await updateGin(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(gin);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canDelete");
  await deleteGin(Number(params!.id));
  return NextResponse.json({ message: "GIN deleted successfully" });
});
