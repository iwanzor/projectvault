import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { listPositionsSchema, createPositionSchema } from "@/lib/validators/accounting";
import { listPositions, createPosition } from "@/lib/services/acc-position.service";
import { checkAccountPermission } from "../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = listPositionsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");
  const result = await listPositions(params.data);
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "canAdd");
  const body = createPositionSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await createPosition(body.data);
  return NextResponse.json(item, { status: 201 });
});
