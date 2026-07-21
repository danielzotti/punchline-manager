"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-2xl",
  showCloseButton = true,
}: ModalProps) {
  // Lock body scroll when modal is open (dialog-no-scroll skill)
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-bg-card border border-border-ui rounded-2xl w-full ${maxWidthClass} overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-ui">
            {typeof title === "string" ? (
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            ) : (
              title || <div />
            )}
            {showCloseButton && (
              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors cursor-pointer h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
