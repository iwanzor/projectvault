import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { listGrnsSchema, createGrnSchema } from "@/lib/validators/warehouse";
import { listGrns, createGrn } from "@/lib/services/grn.service";

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
  const params = listGrnsSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listGrns(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkWarehousePermission(session, "canAdd");
  const body = createGrnSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const grn = await createGrn(
    body.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(grn, { status: 201 });
});
