import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { listParamsSchema } from "@/lib/validators/setup";
import { listComboItems, createComboItem } from "@/lib/services/combo-item.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const listComboSchema = listParamsSchema.extend({
  parentItemId: z.coerce.number().int().positive().optional(),
});

const createComboSchema = z.object({
  parentItemId: z.number().int().positive(),
  childItemId: z.number().int().positive(),
  quantity: z.coerce.number().nullable().optional(),
  estArrivalPrice: z.coerce.number().nullable().optional(),
  fobPrice: z.coerce.number().nullable().optional(),
  defaultPrice: z.coerce.number().nullable().optional(),
  salesPrice: z.coerce.number().nullable().optional(),
});

export const GET = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "viewAll");
  const params = listComboSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listComboItems(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkSetupPermission(session, "canAdd");
  const body = createComboSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const combo = await createComboItem(body.data);
  return NextResponse.json(combo, { status: 201 });
});
