import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateCustomerSchema } from "@/lib/validators/customer";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/lib/services/customer.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const customer = await getCustomerById(Number(params!.id));
  return NextResponse.json(customer);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateCustomerSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const customer = await updateCustomer(Number(params!.id), body.data);
  return NextResponse.json(customer);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteCustomer(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
