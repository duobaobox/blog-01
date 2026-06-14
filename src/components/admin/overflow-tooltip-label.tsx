"use client";

import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span className={cn("min-w-0 truncate", className)} title={label}>
        {label}
      </span>
    );
  }

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
