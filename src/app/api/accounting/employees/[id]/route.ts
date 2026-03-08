import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { updateEmployeeSchema } from "@/lib/validators/accounting";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/services/acc-employee.service";
import { checkAccountPermission } from "../../_helpers";

export const GET = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "viewAll");
  const emp = await getEmployeeById(Number(params!.id));
  return NextResponse.json(emp);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canEdit");
  const body = updateEmployeeSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const emp = await updateEmployee(Number(params!.id), body.data);
  return NextResponse.json(emp);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkAccountPermission(session, "canDelete");
  await deleteEmployee(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
