import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { approveMaterialRequestSchema } from "@/lib/validators/material-request";
import { approveMaterialRequest } from "@/lib/services/material-request.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; canEdit: boolean }[] } },
  action: "canEdit"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const POST = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = approveMaterialRequestSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const mr = await approveMaterialRequest(
    Number(params!.id),
    body.data.isApproved,
    session.user.username
  );
  return NextResponse.json(mr);
});
