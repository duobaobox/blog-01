import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import {
  getTagBadgeStyle,
  getTagDotStyle,
} from "@/features/taxonomy/lib/tag-color";

type TagBadgeProps = {
  name: string;
  color?: string | null;
  className?: string;
};

export function TagBadge({ name, color, className }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full px-2.5 py-0.5 text-xs", className)}
      style={getTagBadgeStyle(color)}
    >
      <span
        className="size-1.5 rounded-full bg-muted-foreground/35"
        style={getTagDotStyle(color)}
      />
      <span className="truncate">{name}</span>
    </Badge>
  );
}
