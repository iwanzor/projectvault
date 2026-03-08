import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import {
  listQuotationsSchema,
  createQuotationSchema,
} from "@/lib/validators/quotation";
import {
  listQuotations,
  createQuotation,
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

export const GET = apiHandler(async (req, { session }) => {
  checkSalesPermission(session, "viewAll");
  const params = listQuotationsSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success)
    throw new ValidationError("Invalid parameters");
  const result = await listQuotations(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSalesPermission(session, "canAdd");
  const body = createQuotationSchema.safeParse(await req.json());
  if (!body.success)
    throw new ValidationError(
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  const quotation = await createQuotation(
    body.data,
    session.user.username,
    session.user.branchCode
  );
  return NextResponse.json(quotation, { status: 201 });
});
