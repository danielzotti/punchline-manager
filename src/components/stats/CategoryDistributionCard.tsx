import React from "react";
import { useIntl } from "react-intl";
import { BarChart3 } from "lucide-react";

interface CategoryDistribution {
  name: string;
  count: number;
}

interface CategoryDistributionCardProps {
  categoriesDistribution: CategoryDistribution[];
  totalPunchlines: number;
}

export function CategoryDistributionCard({
  categoriesDistribution,
  totalPunchlines,
}: CategoryDistributionCardProps) {
  const intl = useIntl();

  return (
    <div className="bg-bg-card border border-border-ui rounded-2xl p-2 md:p-6 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-accent-primary" />
        {intl.formatMessage({ id: "stats.categories_distribution", defaultMessage: "Distribution by Category" })}
      </h3>
      {categoriesDistribution.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10 text-text-muted-light text-sm italic">
          {intl.formatMessage({ id: "category.no_categories", defaultMessage: "No categories created" })}
        </div>
      ) : (
        <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
          {categoriesDistribution.map((cat) => {
            const percentage = totalPunchlines > 0 ? Math.round((cat.count / totalPunchlines) * 100) : 0;
            return (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-primary truncate max-w-[70%]">{cat.name}</span>
                  <span className="text-text-muted">
                    {cat.count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-bg-input rounded-full h-2.5 overflow-hidden border border-border-ui/60">
                  <div
                    className="bg-accent-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
