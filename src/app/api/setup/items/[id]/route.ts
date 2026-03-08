import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateItemSchema } from "@/lib/validators/item";
import { getItemById, updateItem, deleteItem } from "@/lib/services/item.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const item = await getItemById(Number(params!.id));
  return NextResponse.json(item);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateItemSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const item = await updateItem(Number(params!.id), body.data, session.user.userCode);
  return NextResponse.json(item);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteItem(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
