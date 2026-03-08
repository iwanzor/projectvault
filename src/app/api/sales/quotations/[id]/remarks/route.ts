import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { addRemarkSchema } from "@/lib/validators/quotation";
import { getRemarks, addRemark } from "@/lib/services/quotation.service";

function checkSalesPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewDetails: boolean; canEdit: boolean }[] } },
  action: "viewDetails" | "canEdit"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "SALES");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "viewDetails");
  const remarks = await getRemarks(Number(params!.id));
  return NextResponse.json(remarks);
});

export const POST = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "canEdit");
  const body = addRemarkSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const remark = await addRemark(
    Number(params!.id),
    body.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(remark, { status: 201 });
});
