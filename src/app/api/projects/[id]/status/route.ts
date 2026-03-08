import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateStatusSchema } from "@/lib/validators/project";
import { updateStatus } from "@/lib/services/project.service";

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

export const PUT = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = updateStatusSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const project = await updateStatus(Number(params!.id), body.data);
  return NextResponse.json(project);
});
