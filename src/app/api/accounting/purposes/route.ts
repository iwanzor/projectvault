import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { listPurposesSchema, createPurposeSchema } from "@/lib/validators/accounting";
import { listPurposes, createPurpose } from "@/lib/services/purpose.service";
import { checkAccountPermission } from "../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = listPurposesSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listPurposes(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "canAdd");
  const body = createPurposeSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await createPurpose(body.data);
  return NextResponse.json(item, { status: 201 });
});
