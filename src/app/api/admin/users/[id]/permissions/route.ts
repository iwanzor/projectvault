import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { setPermissionsSchema } from "@/lib/validators/admin";
import { getPermissions, setPermissions } from "@/lib/services/user.service";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(
  async (_req: NextRequest, { params }) => {
    const permissions = await getPermissions(Number(params!.id));
    return NextResponse.json(permissions);
  },
  { requireAdmin: true }
);

export const PUT = apiHandler(
  async (req: NextRequest, { params }) => {
    const body = setPermissionsSchema.safeParse(await req.json());
    if (!body.success)
      throw new ValidationError(
        "Validation failed",
        body.error.flatten().fieldErrors
      );
    const permissions = await setPermissions(
      Number(params!.id),
      body.data.permissions
    );
    return NextResponse.json(permissions);
  },
  { requireAdmin: true }
);
