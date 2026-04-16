"use client";

import * as React from "react";
import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ExportWorkbookButtonProps = {
  disabled?: boolean;
};

function getFileNameFromDisposition(disposition: string | null) {
  if (!disposition) {
    return "fitsec-kpi-dashboard.xlsx";
  }

  const match = disposition.match(/filename="(.+?)"/i);
  return match?.[1] ?? "fitsec-kpi-dashboard.xlsx";
}

export function ExportWorkbookButton({
  disabled = false,
}: ExportWorkbookButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      const response = await fetch("/api/export/weekly-snapshots");

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        toast.error(
          body?.message ?? "The Excel export could not be generated.",
        );
        return;
      }

      const blob = await response.blob();
      const fileName = getFileNameFromDisposition(
        response.headers.get("content-disposition"),
      );
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.click();

      window.URL.revokeObjectURL(objectUrl);
      toast.success("Excel workbook exported.");
    } catch (error) {
      console.error("Failed to export the weekly dashboard workbook", error);
      toast.error("The Excel export could not be generated.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isExporting}
    >
      {isExporting ? (
        <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
      ) : (
        <DownloadIcon data-icon="inline-start" />
      )}
      Export Excel
    </Button>
  );
}
