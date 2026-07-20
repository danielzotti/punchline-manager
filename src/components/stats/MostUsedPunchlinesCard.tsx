import React from "react";
import { useIntl } from "react-intl";
import { Award } from "lucide-react";

interface MostUsedPunchline {
  id: string;
  text: string;
  count: number;
}

interface MostUsedPunchlinesCardProps {
  mostUsedPunchlines: MostUsedPunchline[];
}

export function MostUsedPunchlinesCard({ mostUsedPunchlines }: MostUsedPunchlinesCardProps) {
  const intl = useIntl();

  return (
    <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
        <Award className="w-5 h-5 text-accent-primary" />
        {intl.formatMessage({ id: "stats.most_used_punchlines", defaultMessage: "Most Used Punchlines in Collections" })}
      </h3>

      {mostUsedPunchlines.length === 0 ? (
        <div className="py-8 text-center text-text-muted-light text-sm italic">
          {intl.formatMessage({ id: "stats.no_collections_use", defaultMessage: "No punchlines added to collections yet" })}
        </div>
      ) : (
        <div className="divide-y divide-border-ui/60">
          {mostUsedPunchlines.map((p, idx) => (
            <div key={p.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border ${
                    idx === 0
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : idx === 1
                        ? "bg-slate-400/10 text-slate-600 border-slate-400/20"
                        : idx === 2
                          ? "bg-amber-700/10 text-amber-800 border-amber-700/20"
                          : "bg-bg-input text-text-muted border-border-ui"
                  }`}
                >
                  {idx + 1}
                </div>
                {/* Punchline text snippet */}
                <p className="text-sm font-semibold text-text-primary truncate" title={p.text}>
                  {p.text}
                </p>
              </div>

              {/* Collections Badge */}
              <span className="shrink-0 bg-accent-primary/10 text-accent-primary text-xs font-bold px-3 py-1.5 rounded-full border border-accent-primary/15">
                {intl.formatMessage(
                  {
                    id: p.count === 1 ? "collections.item_count_singular" : "collections.item_count_plural",
                    defaultMessage: "{count} collections",
                  },
                  { count: p.count }
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
