import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { listLpoSchema } from "@/lib/validators/accounting";
import { checkAccountPermission } from "../_helpers";

export const GET = apiHandler(async (req, { session }) => {
  checkAccountPermission(session, "viewAll");
  const params = listLpoSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) throw new ValidationError("Invalid parameters");

  const { page, pageSize, search, projectId, sortBy, sortOrder } = params.data;

  const where: Prisma.CumulativeLpoDateWhereInput = {
    ...(projectId ? { projectId } : {}),
    ...(search
      ? {
          OR: [
            { modelNo: { contains: search } },
            { project: { projectNo: { contains: search } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.cumulativeLpoDate.findMany({
      where,
      include: {
        project: { select: { id: true, projectNo: true, description: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cumulativeLpoDate.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
});
