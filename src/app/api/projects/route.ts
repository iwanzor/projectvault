import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import {
  listProjectsSchema,
  createProjectSchema,
} from "@/lib/validators/project";
import {
  listProjects,
  createProject,
} from "@/lib/services/project.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewAll: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewAll" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session }) => {
  checkProjectPermission(session, "viewAll");
  const params = listProjectsSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success)
    throw new ValidationError("Invalid parameters");
  const result = await listProjects(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkProjectPermission(session, "canAdd");
  const body = createProjectSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const project = await createProject(
    body.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(project, { status: 201 });
});
