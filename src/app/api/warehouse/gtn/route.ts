import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { listGtnsSchema, createGtnSchema } from "@/lib/validators/warehouse";
import { listGtns, createGtn } from "@/lib/services/gtn.service";

function checkWarehousePermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewAll: boolean; viewDetails: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewAll" | "viewDetails" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "WAREHOUSE");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session }) => {
  checkWarehousePermission(session, "viewAll");
  const params = listGtnsSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listGtns(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkWarehousePermission(session, "canAdd");
  const body = createGtnSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const gtn = await createGtn(
    body.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(gtn, { status: 201 });
});
