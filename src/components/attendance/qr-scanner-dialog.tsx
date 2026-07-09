"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { QRScannerContent } from "./qr-scanner-content";

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (attendance: unknown) => void;
}

export function QRScannerDialog({
  open,
  onOpenChange,
  onSuccess,
}: QRScannerDialogProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <QRScannerContent
        open={open}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </Suspense>
  );
}
