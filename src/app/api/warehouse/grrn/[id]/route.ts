import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateGrrnSchema } from "@/lib/validators/warehouse";
import {
  getGrrnById,
  updateGrrn,
  deleteGrrn,
} from "@/lib/services/grrn.service";

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
  const grrn = await getGrrnById(Number(params!.id));
  return NextResponse.json(grrn);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canEdit");
  const body = updateGrrnSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const grrn = await updateGrrn(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(grrn);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkWarehousePermission(session, "canDelete");
  await deleteGrrn(Number(params!.id));
  return NextResponse.json({ message: "GRRN deleted successfully" });
});
