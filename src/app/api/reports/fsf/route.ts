import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkReportsPermission } from "../_helpers";
import { listFsfSchema, fsfMasterSchema } from "@/lib/validators/reports";
import { listFsfMasters, createFsfMaster } from "@/lib/services/fsf.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "viewAll");
  const params = listFsfSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listFsfMasters(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkReportsPermission(session, "canAdd");
  const body = fsfMasterSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const master = await createFsfMaster(body.data);
  return NextResponse.json(master, { status: 201 });
});
