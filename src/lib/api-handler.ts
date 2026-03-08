import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AppError, ValidationError } from "@/lib/errors";
import type { Session } from "next-auth";

type RouteHandler = (
  req: NextRequest,
  context: { session: Session; params?: Record<string, string> }
) => Promise<NextResponse | Response>;

interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export function apiHandler(
  handler: RouteHandler,
  options: ApiHandlerOptions = {}
) {
  const { requireAuth = true, requireAdmin = false } = options;

  return async (
    req: NextRequest,
    segmentData?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse | Response> => {
    try {
      const session = await auth();

      if (requireAuth && !session?.user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      if (requireAdmin && !session?.user?.isAdmin) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }

      const params = segmentData
        ? await segmentData.params
        : undefined;

      return await handler(req, {
        session: session!,
        params,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            errors: error.errors,
          },
          { status: error.statusCode }
        );
      }

      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode }
        );
      }

      console.error("Unhandled API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
