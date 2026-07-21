"use client";

import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowLeftRight,
  AlignCenter,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReaderItem {
  id?: string;
  text: string;
  color?: string;
}

interface FullscreenReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReaderItem[];
  align?: "center" | "left";
}

export function FullscreenReaderModal({
  isOpen,
  onClose,
  items,
  align = "center",
}: FullscreenReaderModalProps) {
  const intl = useIntl();
  const [readingFontSize, setReadingFontSize] = useState<number>(32);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReadingFullWidth, setIsReadingFullWidth] = useState<boolean>(false);
  const [textAlignment, setTextAlignment] = useState<"center" | "left">(align);

  // Load settings from localStorage once when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSize = localStorage.getItem("fullscreen-reader-font-size");
      const savedFullWidth = localStorage.getItem("fullscreen-reader-full-width");
      const savedAlign = localStorage.getItem("fullscreen-reader-align");
      if (savedSize) {
        setReadingFontSize(Number(savedSize));
      }
      if (savedFullWidth) {
        setIsReadingFullWidth(savedFullWidth === "true");
      }
      if (savedAlign === "center" || savedAlign === "left") {
        setTextAlignment(savedAlign);
      }
    }
  }, []);

  // Save font size settings to localStorage when changed
  const updateFontSize = (size: number) => {
    setReadingFontSize(size);
    localStorage.setItem("fullscreen-reader-font-size", String(size));
  };

  // Save full width settings to localStorage when changed
  const updateFullWidth = (fullWidth: boolean) => {
    setIsReadingFullWidth(fullWidth);
    localStorage.setItem("fullscreen-reader-full-width", String(fullWidth));
  };

  // Save align setting to localStorage when changed
  const updateAlignment = (alignment: "center" | "left") => {
    setTextAlignment(alignment);
    localStorage.setItem("fullscreen-reader-align", alignment);
  };



  // Lock body scroll (dialog-no-scroll skill)
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

  // Sync fullscreen state based on document event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary/97 backdrop-blur-md animate-fade-in p-0 justify-between">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 md:gap-3 absolute top-2 right-2 md:top-4 md:right-4 z-50">
        {/* Fullscreen Toggle */}
        <Button
          type="button"
          onClick={toggleFullscreen}
          variant="outline"
          className="p-2 bg-bg-card border border-border-ui hover:bg-bg-input text-text-muted hover:text-text-primary rounded-xl transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center h-auto w-auto"
          title={isFullscreen ? "Disattiva schermo intero" : "Schermo intero"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 md:w-5 h-5" />
          ) : (
            <Maximize2 className="w-4 h-4 md:w-5 h-5" />
          )}
        </Button>

        {/* Width Toggle */}
        <Button
          type="button"
          onClick={() => updateFullWidth(!isReadingFullWidth)}
          variant="outline"
          className={`p-2 border transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center h-auto w-auto rounded-xl ${isReadingFullWidth
            ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary hover:bg-accent-primary/20"
            : "bg-bg-card border-border-ui text-text-muted hover:text-text-primary hover:bg-bg-input"
            }`}
          title={intl.formatMessage({
            id: "reading.full_width",
            defaultMessage: "Larghezza massima",
          })}
        >
          <ArrowLeftRight className="w-4 h-4 md:w-5 h-5" />
        </Button>

        {/* Alignment Toggle */}
        <Button
          type="button"
          onClick={() => updateAlignment(textAlignment === "center" ? "left" : "center")}
          variant="outline"
          className={`p-2 border transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center h-auto w-auto rounded-xl ${textAlignment === "center"
              ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary hover:bg-accent-primary/20"
              : "bg-bg-card border-border-ui text-text-muted hover:text-text-primary hover:bg-bg-input"
            }`}
          title={intl.formatMessage({
            id: "reading.alignment",
            defaultMessage: "Allineamento testo",
          })}
        >
          {textAlignment === "center" ? (
            <AlignCenter className="w-4 h-4 md:w-5 h-5" />
          ) : (
            <AlignLeft className="w-4 h-4 md:w-5 h-5" />
          )}
        </Button>


        {/* Font controls */}
        <div className="flex items-center gap-1 bg-bg-card border border-border-ui rounded-xl p-1 shadow-sm">
          <Button
            type="button"
            onClick={() => updateFontSize(Math.max(16, readingFontSize - 4))}
            variant="ghost"
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 cursor-pointer h-auto w-auto"
            title={intl.formatMessage({
              id: "reading.zoom_out",
              defaultMessage: "Rimpicciolisci testo",
            })}
          >
            <ZoomOut className="w-4 h-4 md:w-5 h-5" />
          </Button>
          <Button
            type="button"
            onClick={() => updateFontSize(32)}
            variant="ghost"
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 text-xs font-semibold px-2.5 cursor-pointer h-auto w-auto"
            title={intl.formatMessage({ id: "reading.reset", defaultMessage: "Ripristina" })}
          >
            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
          <Button
            type="button"
            onClick={() => updateFontSize(Math.min(80, readingFontSize + 4))}
            variant="ghost"
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 cursor-pointer h-auto w-auto"
            title={intl.formatMessage({
              id: "reading.zoom_in",
              defaultMessage: "Ingrandisci testo",
            })}
          >
            <ZoomIn className="w-4 h-4 md:w-5 h-5" />
          </Button>
        </div>

        {/* Close Button */}
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="p-2 bg-bg-card border border-border-ui hover:bg-bg-input text-text-muted hover:text-text-primary rounded-xl transition-all duration-150 cursor-pointer shadow-sm h-auto w-auto"
          title={intl.formatMessage({ id: "button.cancel", defaultMessage: "Chiudi" })}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto w-full px-4 pt-24 pb-12">
        <div
          className={`flex flex-col min-h-full mx-auto justify-center w-full transition-all duration-300 gap-8 ${isReadingFullWidth ? "max-w-none px-4 md:px-8" : "max-w-3xl"
            } ${textAlignment === "center" ? "items-center text-center" : "items-start text-left"}`}
        >
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="text-text-primary leading-relaxed rich-text-content break-words w-full selection:bg-accent-primary/20"
              style={{ fontSize: `${readingFontSize}px`, color: item.color || undefined }}
              dangerouslySetInnerHTML={{ __html: item.text }}
            />
          ))}
          {items.length === 0 && (
            <p className="text-text-muted py-12 w-full">
              {intl.formatMessage({
                id: "collections.no_elements_preview",
                defaultMessage: "Nessun elemento da mostrare nell'anteprima",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
