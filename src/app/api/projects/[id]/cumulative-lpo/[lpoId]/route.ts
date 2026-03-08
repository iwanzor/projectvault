import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateCumulativeLpoSchema } from "@/lib/validators/project";
import {
  updateCumulativeLpo,
  deleteCumulativeLpo,
} from "@/lib/services/project.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; canEdit: boolean; canDelete: boolean }[] } },
  action: "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const PUT = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = updateCumulativeLpoSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const lpo = await updateCumulativeLpo(Number(params!.lpoId), body.data);
  return NextResponse.json(lpo);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canDelete");
  await deleteCumulativeLpo(Number(params!.lpoId));
  return NextResponse.json({ message: "Cumulative LPO entry deleted successfully" });
});
