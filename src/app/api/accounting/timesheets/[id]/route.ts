import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updateTimesheetSchema } from "@/lib/validators/accounting";
import { getTimesheetById, updateTimesheet, deleteTimesheet } from "@/lib/services/timesheet.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const ts = await getTimesheetById(Number(params!.id));
  return NextResponse.json(ts);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updateTimesheetSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const ts = await updateTimesheet(Number(params!.id), body.data);
  return NextResponse.json(ts);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deleteTimesheet(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
