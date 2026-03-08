import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema } from "@/lib/validators/setup";
import { createCustomerSchema } from "@/lib/validators/customer";
import { listCustomers, createCustomer } from "@/lib/services/customer.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const listCustomersSchema = listParamsSchema.extend({
  areaId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  isExport: z.coerce.boolean().optional(),
});

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listCustomersSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listCustomers(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createCustomerSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const customer = await createCustomer(body.data);
  return NextResponse.json(customer, { status: 201 });
});
