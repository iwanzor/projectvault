import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateCurrencySchema } from "@/lib/validators/setup";
import { getCurrencyById, updateCurrency, deleteCurrency } from "@/lib/services/currency.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const currency = await getCurrencyById(Number(params!.id));
  return NextResponse.json(currency);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateCurrencySchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const currency = await updateCurrency(Number(params!.id), body.data);
  return NextResponse.json(currency);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteCurrency(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
