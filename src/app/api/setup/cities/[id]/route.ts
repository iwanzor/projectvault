import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateCitySchema } from "@/lib/validators/setup";
import { getCityById, updateCity, deleteCity } from "@/lib/services/country.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const city = await getCityById(Number(params!.id));
  return NextResponse.json(city);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateCitySchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const city = await updateCity(Number(params!.id), body.data);
  return NextResponse.json(city);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteCity(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
