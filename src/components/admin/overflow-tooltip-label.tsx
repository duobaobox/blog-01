"use client";

import { useHasHydrated } from "@/shared/hooks/use-has-hydrated";
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
  const hasHydrated = useHasHydrated();
  const labelElement = (
    <span className={cn("min-w-0 truncate", className)} title={label}>
      {label}
    </span>
  );

  if (!hasHydrated) {
    return labelElement;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={labelElement} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
