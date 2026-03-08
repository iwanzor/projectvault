import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updateDepartmentSchema } from "@/lib/validators/accounting";
import { getDepartmentById, updateDepartment, deleteDepartment } from "@/lib/services/acc-department.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const item = await getDepartmentById(Number(params!.id));
  return NextResponse.json(item);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updateDepartmentSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await updateDepartment(Number(params!.id), body.data);
  return NextResponse.json(item);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deleteDepartment(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
