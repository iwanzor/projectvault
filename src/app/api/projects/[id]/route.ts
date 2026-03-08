import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateProjectSchema } from "@/lib/validators/project";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/lib/services/project.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewAll: boolean; viewDetails: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewAll" | "viewDetails" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "viewDetails");
  const project = await getProjectById(Number(params!.id));
  return NextResponse.json(project);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = updateProjectSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const project = await updateProject(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(project);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canDelete");
  await deleteProject(Number(params!.id));
  return NextResponse.json({ message: "Project cancelled successfully" });
});
