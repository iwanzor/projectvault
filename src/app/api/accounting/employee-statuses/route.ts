import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { listEmployeeStatusesSchema, createStatusSchema } from "@/lib/validators/accounting";
import { listEmployeeStatuses, createEmployeeStatus } from "@/lib/services/acc-employee-status.service";
import { checkAccountPermission } from "../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = listEmployeeStatusesSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listEmployeeStatuses(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "canAdd");
  const body = createStatusSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await createEmployeeStatus(body.data);
  return NextResponse.json(item, { status: 201 });
});
