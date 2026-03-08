import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(
  async () => {
    const branches = await prisma.branch.findMany({
      select: { id: true, branchCode: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: branches, total: branches.length, page: 1, pageSize: branches.length });
  },
  { requireAdmin: true }
);
