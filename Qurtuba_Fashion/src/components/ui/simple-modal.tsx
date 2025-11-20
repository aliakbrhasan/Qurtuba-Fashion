import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "./utils";

type SimpleModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
};

export function SimpleModal({
  open,
  onClose,
  children,
  className,
  backdropClassName,
}: SimpleModalProps) {
  React.useEffect(() => {
    if (typeof document === "undefined" || !open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === "undefined" || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 sm:p-6">
      <div
        className={cn(
          "absolute inset-0 bg-slate-950/70 backdrop-blur-sm",
          backdropClassName,
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border shadow-[0_20px_70px_rgba(15,23,42,0.35)]",
          className,
        )}
      >
        <div className="scrollbar-thin flex max-h-full flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

