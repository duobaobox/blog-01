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
        "rounded-[1.6rem] border border-[#ebe8f5] bg-white/[0.68] p-5 shadow-[0_20px_55px_-42px_rgba(84,78,170,0.28)] backdrop-blur-xl sm:p-6 dark:border-white/10 dark:bg-white/[0.045]",
        className,
      )}
    >
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#20243a] sm:text-2xl dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-6 text-[#7a8093] dark:text-slate-300/70">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <Link
            href={action.href}
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-hover"
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
