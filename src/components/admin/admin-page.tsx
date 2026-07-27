import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type AdminPageProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminPage({
  title,
  description,
  children,
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
        <header className="mb-6">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </header>
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}
