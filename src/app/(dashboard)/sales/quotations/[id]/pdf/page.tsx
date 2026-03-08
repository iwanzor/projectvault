"use client";

import { use, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { FileDown, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

const FORMAT_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "subcategory", label: "Sub-Category Grouped" },
  { value: "grandtotal", label: "Grand Total Summary" },
  { value: "quantity", label: "Quantity Format" },
  { value: "combo", label: "Combo Format" },
] as const;

export default function QuotationPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [format, setFormat] = useState("standard");

  const pdfUrl = `/api/sales/quotations/${id}/pdf?format=${format}`;

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `quotation-${id}-${format}.pdf`;
    link.click();
  }, [pdfUrl, id, format]);

  const handlePrint = useCallback(() => {
    const iframe = document.getElementById(
      "pdf-viewer"
    ) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href={`/sales/quotations`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Quotation PDF Preview</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">PDF Format</CardTitle>
            <div className="flex items-center gap-3">
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-56"
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectOption>
                ))}
              </Select>

              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              <Button size="sm" onClick={handleDownload}>
                <FileDown className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-200 overflow-hidden dark:border-zinc-700">
            <iframe
              id="pdf-viewer"
              key={format}
              src={pdfUrl}
              className="w-full bg-zinc-100 dark:bg-zinc-900"
              style={{ height: "calc(100vh - 250px)", minHeight: "600px" }}
              title="PDF Preview"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
