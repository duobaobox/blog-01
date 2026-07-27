import Link from "next/link";
import { ArrowRight, BellRing, Sparkles } from "lucide-react";
import type { PublicPostCard } from "@/features/posts/queries/post.queries";
import type { ResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import { HomeHeroVisual } from "@/features/home/components/home-hero-visual";

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
  const description = site.subtitle || config.description || site.description;

  return (
    <section className="relative isolate overflow-hidden">
      <div className="relative mx-auto max-w-5xl min-w-0 px-4 pt-12 sm:px-6 sm:pt-14 lg:min-h-[36rem] lg:pt-0 xl:min-h-[39rem]">
        <div className="relative z-20 min-w-0 pb-8 pt-2 sm:pb-10 lg:flex lg:min-h-[36rem] lg:w-[56%] lg:flex-col lg:justify-center lg:py-16 xl:min-h-[39rem] xl:w-[54%]">
          <div className="inline-flex self-start items-center rounded-full border border-site-accent/20 bg-white/[0.78] px-3.5 py-1.5 text-sm font-medium tracking-wide text-site-accent shadow-sm shadow-site-accent/15 backdrop-blur dark:border-site-accent/30 dark:bg-white/5 dark:text-site-accent">
            {config.eyebrow}
          </div>

          <p className="mt-7 text-6xl font-black leading-none tracking-[-0.07em] text-site-accent sm:text-7xl lg:text-[4.8rem]">
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
              className="group inline-flex items-center gap-2 rounded-xl bg-site-accent px-5 py-3 text-sm font-semibold text-site-accent-foreground shadow-lg shadow-site-accent/30 transition hover:-translate-y-0.5 hover:bg-site-accent-hover hover:shadow-xl hover:shadow-site-accent/40"
            >
              <Sparkles className="size-4" />
              {config.primaryAction.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={config.secondaryAction.href}
              className="group inline-flex items-center gap-2 rounded-xl border border-site-accent/20 bg-white/[0.78] px-5 py-3 text-sm font-semibold text-site-accent shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-site-accent/40 hover:bg-white dark:border-site-accent/30 dark:bg-white/5 dark:text-site-accent dark:hover:bg-white/10"
            >
              {config.secondaryAction.label}
              <ArrowRight className="size-4 text-site-accent transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {highlightedPost ? (
            <div className="mt-8 flex max-w-lg items-center gap-2.5 text-sm">
              <BellRing className="size-4 shrink-0 text-site-accent" />
              <span className="shrink-0 font-medium text-site-accent">
                {postSource === "featured" ? "精选推荐：" : "最近更新："}
              </span>
              <Link
                href={`/blog/${highlightedPost.slug}`}
                className="min-w-0 flex-1 truncate rounded-sm text-site-accent transition-colors hover:text-site-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/35"
              >
                《{highlightedPost.title}》
              </Link>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 -mt-5 w-full sm:-mt-10 lg:pointer-events-none lg:absolute lg:bottom-0 lg:left-[28%] lg:right-6 lg:top-0 lg:m-0 lg:w-auto xl:left-[24%]">
          <HomeHeroVisual visual={config.visual} />
        </div>
      </div>
    </section>
  );
}
