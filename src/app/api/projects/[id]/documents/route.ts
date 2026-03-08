import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { addDocumentDetailSchema } from "@/lib/validators/project";
import {
  getDocumentDetails,
  addDocumentDetail,
} from "@/lib/services/project.service";

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
  const documents = await getDocumentDetails(Number(params!.id));
  return NextResponse.json(documents);
});

export const POST = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = addDocumentDetailSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const document = await addDocumentDetail(
    Number(params!.id),
    body.data,
    session.user.branchCode
  );
  return NextResponse.json(document, { status: 201 });
});
