import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { getComboItemById, updateComboItem, deleteComboItem } from "@/lib/services/combo-item.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod/v4";

const updateComboSchema = z.object({
  parentItemId: z.number().int().positive().optional(),
  childItemId: z.number().int().positive().optional(),
  quantity: z.coerce.number().nullable().optional(),
  estArrivalPrice: z.coerce.number().nullable().optional(),
  fobPrice: z.coerce.number().nullable().optional(),
  defaultPrice: z.coerce.number().nullable().optional(),
  salesPrice: z.coerce.number().nullable().optional(),
});

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const combo = await getComboItemById(Number(params!.id));
  return NextResponse.json(combo);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateComboSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const combo = await updateComboItem(Number(params!.id), body.data);
  return NextResponse.json(combo);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteComboItem(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
