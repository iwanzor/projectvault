import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateQuotationSchema } from "@/lib/validators/quotation";
import {
  getQuotationById,
  updateQuotation,
  deleteQuotation,
} from "@/lib/services/quotation.service";

function checkSalesPermission(
  session: { user: { isAdmin: boolean; permissions: { module: string; viewAll: boolean; viewDetails: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[] } },
  action: "viewAll" | "viewDetails" | "canAdd" | "canEdit" | "canDelete"
) {
  if (session.user.isAdmin) return;
  const perm = session.user.permissions?.find((p) => p.module === "SALES");
  if (!perm || !perm[action]) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

export const GET = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "viewDetails");
  const quotation = await getQuotationById(Number(params!.id));
  return NextResponse.json(quotation);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "canEdit");
  const body = updateQuotationSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const quotation = await updateQuotation(
    Number(params!.id),
    body.data,
    session.user.username
  );
  return NextResponse.json(quotation);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSalesPermission(session, "canDelete");
  await deleteQuotation(Number(params!.id));
  return NextResponse.json({ message: "Quotation archived successfully" });
});
