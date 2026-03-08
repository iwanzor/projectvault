import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema, createDocumentInfoSchema } from "@/lib/validators/setup";
import { listDocumentInfos, createDocumentInfo } from "@/lib/services/document-info.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listParamsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listDocumentInfos(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createDocumentInfoSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const doc = await createDocumentInfo(body.data);
  return NextResponse.json(doc, { status: 201 });
});
