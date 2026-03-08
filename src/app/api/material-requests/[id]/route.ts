import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateMaterialRequestSchema } from "@/lib/validators/material-request";
import {
  getMaterialRequestById,
  updateMaterialRequest,
  deleteMaterialRequest,
} from "@/lib/services/material-request.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewDetails: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewDetails" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "viewDetails");
  const mr = await getMaterialRequestById(Number(params!.id));
  return NextResponse.json(mr);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = updateMaterialRequestSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const mr = await updateMaterialRequest(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(mr);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canDelete");
  await deleteMaterialRequest(Number(params!.id));
  return NextResponse.json({ message: "Material request deleted successfully" });
});
