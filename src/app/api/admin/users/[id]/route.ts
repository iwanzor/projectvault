import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { updateUserSchema } from "@/lib/validators/admin";
import { getUserById, updateUser, deleteUser } from "@/lib/services/user.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(
  async (_req: NextRequest, { params }) => {
    const user = await getUserById(Number(params!.id));
    return NextResponse.json(user);
  },
  { requireAdmin: true }
);

export const PUT = apiHandler(
  async (req: NextRequest, { params }) => {
    const body = updateUserSchema.safeParse(await req.json());
    if (!body.success)
      throw new ValidationError(
        "Validation failed",
        body.error.flatten().fieldErrors
      );
    const user = await updateUser(Number(params!.id), body.data);
    return NextResponse.json(user);
  },
  { requireAdmin: true }
);

export const DELETE = apiHandler(
  async (_req: NextRequest, { session, params }) => {
    const result = await deleteUser(Number(params!.id), Number(session.user.id));
    return NextResponse.json(result);
  },
  { requireAdmin: true }
);
