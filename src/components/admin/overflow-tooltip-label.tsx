"use client";

import { cn } from "@/shared/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type OverflowTooltipLabelProps = {
  label: string;
  className?: string;
};

export function OverflowTooltipLabel({
  label,
  className,
}: OverflowTooltipLabelProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className={cn("min-w-0 truncate", className)} title={label}>
            {label}
          </span>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
