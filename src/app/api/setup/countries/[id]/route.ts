import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateCountrySchema } from "@/lib/validators/setup";
import { getCountryById, updateCountry, deleteCountry } from "@/lib/services/country.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const country = await getCountryById(Number(params!.id));
  return NextResponse.json(country);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateCountrySchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const country = await updateCountry(Number(params!.id), body.data);
  return NextResponse.json(country);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteCountry(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
