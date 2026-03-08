import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import {
  listMaterialRequestsSchema,
  createMaterialRequestSchema,
} from "@/lib/validators/material-request";
import {
  listMaterialRequests,
  createMaterialRequest,
} from "@/lib/services/material-request.service";

function checkProjectPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewDetails: boolean; canAdd: boolean }[] } },
  action: "viewDetails" | "canAdd"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "PROJECT");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "viewDetails");
  const searchParams = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = listMaterialRequestsSchema.safeParse({
    ...searchParams,
    projectId: params!.id,
  });
  if (!parsed.success)
    throw new ValidationError("Invalid parameters");
  const result = await listMaterialRequests(parsed.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session, params }) => {
  checkProjectPermission(session, "canAdd");
  const body = await req.json();
  const parsed = createMaterialRequestSchema.safeParse({
    ...body,
    projectId: Number(params!.id),
  });
  if (!parsed.success)
    throw new ValidationError(
      "Validation failed",
      parsed.error.flatten().fieldErrors
    );
  const mr = await createMaterialRequest(
    parsed.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(mr, { status: 201 });
});
