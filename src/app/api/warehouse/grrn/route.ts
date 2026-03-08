import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { listGrrnsSchema, createGrrnSchema } from "@/lib/validators/warehouse";
import { listGrrns, createGrrn } from "@/lib/services/grrn.service";

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
  const params = listGrrnsSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listGrrns(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkWarehousePermission(session, "canAdd");
  const body = createGrrnSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const grrn = await createGrrn(
    body.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(grrn, { status: 201 });
});
