import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema, createQuotationTermsSchema } from "@/lib/validators/setup";
import { listQuotationTerms, createQuotationTerms } from "@/lib/services/quotation-terms.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listParamsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listQuotationTerms(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createQuotationTermsSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const qt = await createQuotationTerms(body.data);
  return NextResponse.json(qt, { status: 201 });
});
