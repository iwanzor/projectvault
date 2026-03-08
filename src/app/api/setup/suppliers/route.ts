import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema } from "@/lib/validators/setup";
import { createSupplierSchema } from "@/lib/validators/supplier";
import { listSuppliers, createSupplier } from "@/lib/services/supplier.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const listSuppliersSchema = listParamsSchema.extend({
  cityId: z.coerce.number().int().positive().optional(),
  isImport: z.coerce.boolean().optional(),
});

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listSuppliersSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listSuppliers(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createSupplierSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const supplier = await createSupplier(body.data);
  return NextResponse.json(supplier, { status: 201 });
});
