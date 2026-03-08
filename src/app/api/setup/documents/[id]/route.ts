import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { checkSetupPermission } from "@/lib/permissions";
import { updateDocumentInfoSchema } from "@/lib/validators/setup";
import { getDocumentInfoById, updateDocumentInfo, deleteDocumentInfo } from "@/lib/services/document-info.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "viewAll");
  const doc = await getDocumentInfoById(Number(params!.id));
  return NextResponse.json(doc);
});

export const PUT = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canEdit");
  const body = updateDocumentInfoSchema.safeParse(await req.json());
  if (!body.success) throw new ValidationError("Validation failed", body.error.flatten().fieldErrors);
  const doc = await updateDocumentInfo(Number(params!.id), body.data);
  return NextResponse.json(doc);
});

export const DELETE = apiHandler(async (req, { session, params }) => {
  checkSetupPermission(session, "canDelete");
  await deleteDocumentInfo(Number(params!.id));
  return NextResponse.json({ message: "Deleted successfully" });
});
