import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { addCumulativeLpoSchema } from "@/lib/validators/project";
import {
  getCumulativeLpoDates,
  addCumulativeLpo,
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
  const lpos = await getCumulativeLpoDates(Number(params!.id));
  return NextResponse.json(lpos);
});

export const POST = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canEdit");
  const body = addCumulativeLpoSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const lpo = await addCumulativeLpo(Number(params!.id), body.data);
  return NextResponse.json(lpo, { status: 201 });
});
