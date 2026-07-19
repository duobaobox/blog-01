import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellRing, Sparkles } from "lucide-react";
import type { PublicPostCard } from "@/features/posts/queries/post.queries";
import { getPostDisplayDate } from "@/features/posts/lib/post-status";
import type { ResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import { formatDate } from "@/shared/lib/date";

type HomeHeroProps = {
  site: Pick<ResolvedSiteConfig, "name" | "description" | "subtitle">;
  config: HomeHeroConfig;
  highlightedPost?: PublicPostCard;
  postSource: "featured" | "latest";
};

function HomeHeroVisual({ config }: Pick<HomeHeroProps, "config">) {
  return (
    <div className="relative z-10 flex min-h-[20rem] w-full items-end justify-center self-end sm:min-h-[25rem] lg:min-h-[31rem] lg:justify-end">
      <div className="absolute bottom-[8%] left-[12%] h-[34%] w-[68%] rounded-[50%] bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
      <Image
        src={config.visual.imageUrl}
        alt={config.visual.imageAlt}
        width={960}
        height={598}
        priority
        unoptimized
        sizes="(min-width: 1280px) 760px, (min-width: 1024px) 58vw, 94vw"
        className="relative h-auto w-[min(46rem,112%)] max-w-none translate-y-px object-contain object-bottom drop-shadow-[0_28px_35px_rgba(93,72,170,0.12)] lg:-mr-12 xl:-mr-20"
      />
    </div>
  );
}

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
    <section className="relative isolate overflow-hidden border-b border-violet-100/80 bg-[radial-gradient(circle_at_12%_6%,rgba(255,255,255,0.98),transparent_38%),radial-gradient(circle_at_74%_28%,rgba(124,92,255,0.16),transparent_35%),linear-gradient(115deg,#fcfcff_0%,#f8f7ff_48%,#f0edff_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_74%_28%,rgba(124,92,255,0.18),transparent_34%),linear-gradient(115deg,#15141d_0%,#191724_55%,#211c35_100%)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[10%] -top-[38%] h-[145%] w-[70%] rounded-[50%] border border-violet-200/45 bg-violet-100/20 dark:border-violet-400/10 dark:bg-violet-400/5" />
        <div className="absolute right-[18%] top-[24%] h-[76%] w-[48%] rounded-[50%] border border-violet-200/35 bg-white/10 dark:border-violet-400/10" />
        <div className="absolute -bottom-24 left-[32%] size-[28rem] rounded-full bg-violet-200/25 blur-3xl dark:bg-violet-700/10" />

        <div className="absolute right-0 top-0 hidden h-full w-[23%] opacity-45 blur-[1.5px] lg:block">
          <div className="absolute right-[12%] top-0 h-full w-px bg-violet-200/70 dark:bg-violet-400/10" />
          <div className="absolute right-[31%] top-0 h-full w-px bg-violet-200/45 dark:bg-violet-400/10" />
          <div className="absolute right-[5%] top-[16%] h-2 w-[72%] rounded-full bg-white/80 shadow-[0_24px_0_rgba(255,255,255,0.7),0_48px_0_rgba(255,255,255,0.64),0_72px_0_rgba(255,255,255,0.58)] dark:bg-white/5 dark:shadow-[0_24px_0_rgba(255,255,255,0.04),0_48px_0_rgba(255,255,255,0.035),0_72px_0_rgba(255,255,255,0.03)]" />
          <div className="absolute right-[12%] top-[20%] h-24 w-8 rounded-t-full bg-violet-300/35" />
          <div className="absolute right-[42%] top-[21%] h-20 w-6 rounded-t-full bg-violet-200/40" />
        </div>
      </div>

      <div className="relative mx-auto grid min-h-[35rem] max-w-7xl items-center gap-4 px-5 pt-14 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:px-10 lg:pt-0 xl:px-12">
        <div className="relative z-20 pb-12 pt-3 sm:pb-14 lg:py-16 xl:pl-2">
          <div className="inline-flex items-center rounded-full border border-violet-200/70 bg-white/70 px-3.5 py-1.5 text-sm font-medium tracking-wide text-violet-600 shadow-[0_8px_24px_-14px_rgba(109,78,255,0.5)] backdrop-blur dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-300">
            {config.eyebrow}
          </div>

          <p className="mt-7 bg-linear-to-r from-violet-600 via-indigo-500 to-violet-400 bg-clip-text text-6xl font-black leading-none tracking-[-0.07em] text-transparent sm:text-7xl lg:text-[5.2rem]">
            {config.greeting}
          </p>
          <h1 className="mt-3 max-w-[13ch] text-4xl font-black leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[3.65rem] dark:text-white">
            {config.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-500 sm:text-lg dark:text-slate-300/75">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={config.primaryAction.href}
              className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(91,66,230,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-14px_rgba(91,66,230,0.82)]"
            >
              <Sparkles className="size-4" />
              {config.primaryAction.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={config.secondaryAction.href}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {config.secondaryAction.label}
              <ArrowRight className="size-4 text-violet-600 transition-transform group-hover:translate-x-0.5 dark:text-violet-300" />
            </Link>
          </div>

          {highlightedPost ? (
            <Link
              href={`/blog/${highlightedPost.slug}`}
              className="group mt-9 flex max-w-xl items-center gap-2.5 border-t border-violet-100/90 pt-5 text-sm dark:border-white/10"
            >
              <BellRing className="size-4 shrink-0 text-violet-500" />
              <span className="shrink-0 font-medium text-violet-600 dark:text-violet-300">
                {postSource === "featured" ? "精选推荐：" : "最近更新："}
              </span>
              <span className="min-w-0 flex-1 truncate text-violet-600/85 transition-colors group-hover:text-violet-700 dark:text-violet-300/80">
                《{highlightedPost.title}》
              </span>
              {highlightedDate ? (
                <span className="hidden shrink-0 text-xs text-slate-400 sm:inline dark:text-slate-400">
                  {formatDate(highlightedDate)}
                </span>
              ) : null}
              <ArrowRight className="size-4 shrink-0 text-violet-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>

        <HomeHeroVisual config={config} />
      </div>
    </section>
  );
}
