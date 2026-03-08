"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  endpoint: string;
  filename?: string;
  params?: Record<string, string>;
  label?: string;
}

export function ExportButton({ endpoint, filename = "export.csv", params, label = "Export CSV" }: ExportButtonProps) {
  const [loading, setLoading] = React.useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const url = new URL(endpoint, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) url.searchParams.set(k, v);
        });
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Exporting..." : label}
    </Button>
  );
}
