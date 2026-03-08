import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError } from "@/lib/errors";
import { reviseQuotation } from "@/lib/services/quotation.service";

function checkSalesPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; canAdd: boolean }[] } },
  action: "canAdd"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "SALES");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const POST = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "canAdd");
  const quotation = await reviseQuotation(
    Number(params!.id),
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(quotation, { status: 201 });
});
