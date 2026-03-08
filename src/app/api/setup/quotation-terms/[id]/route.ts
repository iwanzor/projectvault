import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateQuotationTermsSchema } from "@/lib/validators/setup";
import { getQuotationTermsById, updateQuotationTerms, deleteQuotationTerms } from "@/lib/services/quotation-terms.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const qt = await getQuotationTermsById(Number(params!.id));
  return NextResponse.json(qt);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateQuotationTermsSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const qt = await updateQuotationTerms(Number(params!.id), body.data);
  return NextResponse.json(qt);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteQuotationTerms(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
