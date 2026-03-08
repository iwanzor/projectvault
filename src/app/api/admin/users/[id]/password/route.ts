import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { changePasswordSchema } from "@/lib/validators/admin";
import { changePassword } from "@/lib/services/user.service";
import { ValidationError } from "@/lib/errors";

export const PUT = apiHandler(
  async (req: NextRequest, { params }) => {
    const body = changePasswordSchema.safeParse(await req.json());
    if (!body.success)
      throw new ValidationError(
        "Validation failed",
        body.error.flatten().fieldErrors
      );
    const result = await changePassword(Number(params!.id), body.data.newPassword);
    return NextResponse.json(result);
  },
  { requireAdmin: true }
);
