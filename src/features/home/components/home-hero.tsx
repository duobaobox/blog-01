import Link from "next/link";
import { ArrowRight, BellRing, Sparkles } from "lucide-react";
import type { PublicPostCard } from "@/features/posts/queries/post.queries";
import { getPostDisplayDate } from "@/features/posts/lib/post-status";
import type { ResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import { HomeHeroVisual } from "@/features/home/components/home-hero-visual";
import { formatDate } from "@/shared/lib/date";

type HomeHeroProps = {
  site: Pick<ResolvedSiteConfig, "name" | "description" | "subtitle">;
  config: HomeHeroConfig;
  highlightedPost?: PublicPostCard;
  postSource: "featured" | "latest";
};

export function HomeHero({
  site,
  config,
  highlightedPost,
  postSource,
}: HomeHeroProps) {
  const highlightedDate = highlightedPost
    ? getPostDisplayDate(highlightedPost)
    : null;
  const description = site.subtitle || config.description || site.description;

  return (
    <section className="relative isolate overflow-hidden">
      <div className="relative mx-auto grid min-h-[34rem] max-w-5xl min-w-0 items-center gap-5 px-4 pt-12 sm:px-6 sm:pt-14 lg:grid-cols-[0.94fr_1.06fr] lg:pt-0">
        <div className="relative z-20 min-w-0 pb-11 pt-2 sm:pb-14 lg:py-16">
          <div className="inline-flex items-center rounded-full border border-[#dedcff] bg-white/[0.78] px-3.5 py-1.5 text-sm font-medium tracking-wide text-[#6d63f2] shadow-[0_8px_24px_-16px_rgba(100,91,235,0.5)] backdrop-blur dark:border-[#8b84ff]/20 dark:bg-white/5 dark:text-[#b9b5ff]">
            {config.eyebrow}
          </div>

          <p className="mt-7 bg-linear-to-r from-[#7663ff] via-[#6878ff] to-[#75a0ff] bg-clip-text text-6xl font-black leading-none tracking-[-0.07em] text-transparent sm:text-7xl lg:text-[4.8rem]">
            {config.greeting}
          </p>
          <h1 className="mt-3 max-w-[12ch] text-4xl font-black leading-[1.08] tracking-[-0.055em] text-[#20243a] sm:text-5xl lg:text-[3.35rem] dark:text-white">
            {config.title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-[#747b91] sm:text-lg dark:text-slate-300/75">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={config.primaryAction.href}
              className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#7763ff] to-[#587cff] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(91,86,230,0.64)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-14px_rgba(91,86,230,0.72)]"
            >
              <Sparkles className="size-4" />
              {config.primaryAction.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={config.secondaryAction.href}
              className="group inline-flex items-center gap-2 rounded-xl border border-[#e5e3f2] bg-white/[0.78] px-5 py-3 text-sm font-semibold text-[#384056] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#d4d0ff] hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {config.secondaryAction.label}
              <ArrowRight className="size-4 text-[#6c63f2] transition-transform group-hover:translate-x-0.5 dark:text-[#b7b2ff]" />
            </Link>
          </div>

          {highlightedPost ? (
            <Link
              href={`/blog/${highlightedPost.slug}`}
              className="group mt-8 flex max-w-lg items-center gap-2.5 border-t border-[#eceaf7] pt-5 text-sm dark:border-white/10"
            >
              <BellRing className="size-4 shrink-0 text-[#7468f4]" />
              <span className="shrink-0 font-medium text-[#6f64ee] dark:text-[#b9b5ff]">
                {postSource === "featured" ? "精选推荐：" : "最近更新："}
              </span>
              <span className="min-w-0 flex-1 truncate text-[#7e78bc] transition-colors group-hover:text-[#6258df] dark:text-[#b9b5ff]/80">
                《{highlightedPost.title}》
              </span>
              {highlightedDate ? (
                <span className="hidden shrink-0 text-xs text-[#9ba1b2] sm:inline dark:text-slate-400">
                  {formatDate(highlightedDate)}
                </span>
              ) : null}
              <ArrowRight className="size-4 shrink-0 text-[#7468f4] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>

        <HomeHeroVisual visual={config.visual} />
      </div>
    </section>
  );
}
