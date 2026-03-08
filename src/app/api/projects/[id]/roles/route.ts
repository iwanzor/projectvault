import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { addProjectRoleSchema } from "@/lib/validators/project";
import { getRoles, addRole } from "@/lib/services/project.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewDetails: boolean; canEdit: boolean }[] } },
  action: "viewDetails" | "canEdit"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "viewDetails");
  const roles = await getRoles(Number(params!.id));
  return NextResponse.json(roles);
});

export const POST = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = addProjectRoleSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const role = await addRole(Number(params!.id), body.data);
  return NextResponse.json(role, { status: 201 });
});
