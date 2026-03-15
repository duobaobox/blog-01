import { cn } from "@/shared/lib/utils";
import { getCategoryIcon } from "@/features/taxonomy/lib/category-icon";

type CategoryBadgeProps = {
  name: string;
  index?: number;
  className?: string;
  showCount?: number;
};

export function CategoryBadge({
  name,
  index = 0,
  className,
  showCount,
}: CategoryBadgeProps) {
  const Icon = getCategoryIcon(name);

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm transition-colors duration-200 hover:bg-accent/50",
        className,
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{name}</span>
      {showCount !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">
          {showCount}
        </span>
      )}
    </div>
  );
}
