import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getUserStats } from "@/lib/services/user.service";

export const GET = apiHandler(
  async () => {
    const stats = await getUserStats();
    return NextResponse.json(stats);
  },
  { requireAdmin: true }
);
