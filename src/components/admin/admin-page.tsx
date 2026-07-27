import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type AdminPageProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminPage({
  title,
  description,
  children,
  actions,
  className,
  contentClassName,
}: AdminPageProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className={cn(
          "mx-auto w-full max-w-[1680px] p-4 md:p-6",
          className,
        )}
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}
