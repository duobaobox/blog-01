"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/shared/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type OverflowTooltipLabelProps = {
  label: string;
  className?: string;
};

const subscribeToHydration = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

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
