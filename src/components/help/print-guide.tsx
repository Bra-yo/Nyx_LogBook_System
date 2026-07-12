"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface PrintGuideProps {
  title: string;
  overview: string;
  content: string;
}

export function PrintGuide({ title, overview, content }: PrintGuideProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.6}h1,h2,h3{color:#0f172a}li{margin-bottom:8px}</style></head><body><h1>${title}</h1><p>${overview}</p>${content}</body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPdf = () => {
    handlePrint();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print Guide
      </Button>
      <Button size="sm" variant="secondary" onClick={handleDownloadPdf}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
    </div>
  );
}
