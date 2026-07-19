import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type HomeSectionShellProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
  children: ReactNode;
};

export function HomeSectionShell({
  title,
  description,
  action,
  className,
  children,
}: HomeSectionShellProps) {
  return (
    <section
      className={cn(
        "rounded-[1.6rem] border border-violet-100/90 bg-white/[0.72] p-5 shadow-[0_22px_60px_-42px_rgba(91,66,230,0.34)] backdrop-blur-xl sm:p-6 lg:p-7 dark:border-white/10 dark:bg-white/[0.045]",
        className,
      )}
    >
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-300/70">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <Link
            href={action.href}
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
          >
            {action.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  );
}
