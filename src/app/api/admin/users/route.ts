import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { listUsersSchema, createUserSchema } from "@/lib/validators/admin";
import { listUsers, createUser } from "@/lib/services/user.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(
  async (req: NextRequest) => {
    const params = listUsersSchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    if (!params.success) throw new ValidationError("Invalid parameters");
    const result = await listUsers(params.data);
    return NextResponse.json(result);
  },
  { requireAdmin: true }
);

export const POST = apiHandler(
  async (req: NextRequest) => {
    const body = createUserSchema.safeParse(await req.json());
    if (!body.success)
      throw new ValidationError(
        "Validation failed",
        body.error.flatten().fieldErrors
      );
    const user = await createUser(body.data);
    return NextResponse.json(user, { status: 201 });
  },
  { requireAdmin: true }
);
