import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError } from "@/lib/errors";
import { submitQuotation } from "@/lib/services/quotation.service";

function checkSalesPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; canEdit: boolean }[] } },
  action: "canEdit"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "SALES");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const POST = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "canEdit");
  const quotation = await submitQuotation(
    Number(params!.id),
    session.user.username
  );
  return NextResponse.json(quotation);
});
