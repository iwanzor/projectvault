import { apiHandler } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { renderQuotationPdf } from "@/lib/pdf/render-pdf";
import type { PdfFormat } from "@/lib/pdf/types";

const validFormats = new Set([
  "standard",
  "subcategory",
  "grandtotal",
  "quantity",
  "combo",
]);

export const GET = apiHandler(async (req, context) => {
  const id = Number(context.params?.id);

  if (!id || isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid quotation ID" },
      { status: 400 }
    );
  }

  const formatParam = req.nextUrl.searchParams.get("format") || "standard";
  const format: PdfFormat = validFormats.has(formatParam)
    ? (formatParam as PdfFormat)
    : "standard";

  const quotation = await prisma.salesQuotationMaster.findUnique({
    where: { id },
    include: {
      customer: true,
      quotationTerms: true,
      details: {
        orderBy: { serialNo: "asc" },
      },
    },
  });

  if (!quotation) {
    throw new NotFoundError("Quotation not found");
  }

  const buffer = await renderQuotationPdf(quotation, format);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="QN-${quotation.quotationNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
