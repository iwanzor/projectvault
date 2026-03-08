import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { StandardFormat } from "./format-standard";
import { SubcategoryFormat } from "./format-subcategory";
import { GrandTotalFormat } from "./format-grandtotal";
import { QuantityFormat } from "./format-quantity";
import { ComboFormat } from "./format-combo";
import type { QuotationWithDetails, PdfFormat } from "./types";

const formatComponents = {
  standard: StandardFormat,
  subcategory: SubcategoryFormat,
  grandtotal: GrandTotalFormat,
  quantity: QuantityFormat,
  combo: ComboFormat,
} as const;

export async function renderQuotationPdf(
  quotation: QuotationWithDetails,
  format: PdfFormat = "standard"
): Promise<Buffer> {
  const Component = formatComponents[format];
  const element = createElement(Component, { quotation });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
