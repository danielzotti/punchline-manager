"use client";

import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { Edit2, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Punchline } from "@/hooks/usePunchlines";

interface ClampedPunchlineTextProps {
  text: string;
}

export function ClampedPunchlineText({ text }: ClampedPunchlineTextProps) {
  const intl = useIntl();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const checkClamp = () => {
      const el = containerRef.current;
      if (el) {
        setIsClamped(el.scrollHeight > el.clientHeight);
      }
    };

    checkClamp();

    // Use ResizeObserver to respond to layout size changes dynamically
    const resizeObserver = new ResizeObserver(() => {
      checkClamp();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [text]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="text-text-primary text-base mb-2 leading-relaxed rich-text-content line-clamp-6"
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {isClamped && (
        <div className="inline-flex items-center gap-1 text-accent-primary text-xs font-semibold hover:text-accent-primary/80 transition-colors mb-3 bg-accent-primary/5 hover:bg-accent-primary/10 px-2.5 py-1 rounded-full border border-accent-primary/10">
          <span>{intl.formatMessage({ id: "punchline.read_more", defaultMessage: "Read more" })}</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

interface PunchlineCardProps {
  item: Punchline;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onEdit: (item: Punchline) => void;
  onDelete: (id: string) => void;
  onOpenReading: (item: Punchline) => void;
}

export function PunchlineCard({
  item,
  isSelected,
  onSelectToggle,
  onEdit,
  onDelete,
  onOpenReading,
}: PunchlineCardProps) {
  const intl = useIntl();

  return (
    <div
      onClick={() => onOpenReading(item)}
      className={`bg-bg-card border ${
        isSelected ? "border-accent-primary ring-1 ring-accent-primary" : "border-border-ui hover:border-accent-primary/50"
      } rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm group cursor-pointer relative`}
    >
      <div>
        {/* Card Header Status & Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Checkbox for selection */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectToggle(item.id);
              }}
              className="flex items-center"
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="w-5 h-5 rounded border-border-ui text-accent-primary focus:ring-accent-primary cursor-pointer"
              />
            </div>

            {item.status ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm break-all"
                style={{
                  backgroundColor: `${item.status.color}15`,
                  color: item.status.color,
                  borderColor: `${item.status.color}30`,
                }}
              >
                {item.status.name}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              variant="ghost"
              size="icon"
              className="hover:bg-bg-input text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer h-8 w-8"
              title={intl.formatMessage({ id: "button.edit" })}
            >
              <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              variant="ghost"
              size="icon"
              className="hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer h-8 w-8"
              title={intl.formatMessage({ id: "button.delete" })}
            >
              <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </Button>
          </div>
        </div>

        {/* Text (HTML Rendered) */}
        <ClampedPunchlineText text={item.text} />

        {/* Notes if any */}
        {item.notes && (
          <div className="mb-4 bg-bg-input/40 rounded-r-xl p-3 border-l-2 border-accent-primary border-y border-r border-border-ui transition-colors duration-200">
            <span className="text-text-muted-light font-bold text-[9px] uppercase block mb-1 tracking-wider">
              {intl.formatMessage({ id: "punchline.notes" })}:
            </span>
            <p className="text-xs text-text-muted italic">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Category Tags */}
      {item.punchline_categories && item.punchline_categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-border-ui transition-colors duration-200">
          {item.punchline_categories.map((pc) => (
            <span
              key={pc.id}
              className="bg-bg-input text-text-muted px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-border-ui"
            >
              {pc.category?.name || "..."}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
