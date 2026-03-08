import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateRemarkSchema } from "@/lib/validators/quotation";
import { updateRemark, deleteRemark } from "@/lib/services/quotation.service";

function checkSalesPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; canEdit: boolean; canDelete: boolean }[] } },
  action: "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "SALES");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "canEdit");
  const body = updateRemarkSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const remark = await updateRemark(Number(params!.remarkId), body.data);
  return NextResponse.json(remark);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "canDelete");
  await deleteRemark(Number(params!.remarkId));
  return NextResponse.json({ message: "Remark deleted successfully" });
});
