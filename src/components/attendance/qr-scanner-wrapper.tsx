"use client";

import { Suspense } from "react";
import { QRScannerDialog } from "./qr-scanner-dialog";
import { Loader2 } from "lucide-react";

interface QRScannerWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (attendance: unknown) => void;
}

export function QRScannerWrapper({
  open,
  onOpenChange,
  onSuccess,
}: QRScannerWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <QRScannerDialog
        open={open}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    </Suspense>
  );
}
