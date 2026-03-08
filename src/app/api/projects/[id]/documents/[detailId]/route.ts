import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateDocumentDetailSchema } from "@/lib/validators/project";
import {
  updateDocumentDetail,
  deleteDocumentDetail,
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
  const body = updateDocumentDetailSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const document = await updateDocumentDetail(
    Number(params!.detailId),
    body.data
  );
  return NextResponse.json(document);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canDelete");
  await deleteDocumentDetail(Number(params!.detailId));
  return NextResponse.json({ message: "Document detail deleted successfully" });
});
