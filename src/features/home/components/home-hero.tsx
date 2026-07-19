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
    <div className="relative z-10 flex min-h-[19rem] min-w-0 w-full items-end justify-center self-end overflow-hidden sm:min-h-[24rem] lg:min-h-[29rem] lg:justify-end">
      <div className="absolute bottom-[9%] left-[14%] h-[32%] w-[66%] rounded-[50%] bg-[#9f9cff]/14 blur-3xl dark:bg-[#7770ff]/10" />

      <div className="relative w-full max-w-[40rem]">
        <Image
          src={config.visual.imageUrl}
          alt={config.visual.imageAlt}
          width={960}
          height={598}
          priority
          unoptimized
          sizes="(min-width: 1024px) 540px, 94vw"
          className="relative h-auto w-full object-contain object-bottom drop-shadow-[0_24px_34px_rgba(84,78,170,0.12)]"
        />

        {/* 遮住素材中笔记本底部多余的横向金属边，位置使用百分比以适配响应式缩放。 */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[16.2%] left-[36.5%] z-20 h-[4.4%] w-[31%] rounded-full bg-[linear-gradient(180deg,#f2d5bf_0%,#e8bd9f_100%)] shadow-[0_3px_10px_rgba(156,104,74,0.08)] blur-[0.35px] dark:opacity-90"
        />
      </div>
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
    <section className="relative isolate overflow-hidden border-b border-[#ebe9f7] bg-[radial-gradient(circle_at_14%_8%,rgba(255,255,255,0.98),transparent_38%),radial-gradient(circle_at_76%_30%,rgba(116,126,255,0.14),transparent_37%),linear-gradient(115deg,#ffffff_0%,#fafaff_45%,#f3f1ff_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_76%_30%,rgba(112,102,255,0.16),transparent_36%),linear-gradient(115deg,#15151d_0%,#181823_54%,#211e35_100%)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[13%] -top-[43%] h-[150%] w-[72%] rounded-[50%] border border-[#dcdcff]/60 bg-[#eef0ff]/36 dark:border-[#8880ff]/10 dark:bg-[#7770ff]/5" />
        <div className="absolute right-[16%] top-[25%] h-[74%] w-[46%] rounded-[50%] border border-[#e4e2ff]/65 bg-white/10 dark:border-[#8d83ff]/10" />
        <div className="absolute -bottom-28 left-[35%] size-[26rem] rounded-full bg-[#d9dcff]/28 blur-3xl dark:bg-[#665cff]/10" />

        <div className="absolute right-0 top-0 hidden h-full w-[20%] opacity-40 blur-[1.5px] lg:block">
          <div className="absolute right-[14%] top-0 h-full w-px bg-[#dfe1ff]/75 dark:bg-[#8b84ff]/10" />
          <div className="absolute right-[34%] top-0 h-full w-px bg-[#e4e4ff]/65 dark:bg-[#8b84ff]/10" />
          <div className="absolute right-[6%] top-[16%] h-2 w-[70%] rounded-full bg-white/85 shadow-[0_24px_0_rgba(255,255,255,0.74),0_48px_0_rgba(255,255,255,0.66),0_72px_0_rgba(255,255,255,0.58)] dark:bg-white/5 dark:shadow-[0_24px_0_rgba(255,255,255,0.04),0_48px_0_rgba(255,255,255,0.035),0_72px_0_rgba(255,255,255,0.03)]" />
          <div className="absolute right-[13%] top-[20%] h-24 w-8 rounded-t-full bg-[#a8a5ff]/28" />
          <div className="absolute right-[43%] top-[21%] h-20 w-6 rounded-t-full bg-[#c9c8ff]/38" />
        </div>
      </div>

      <div className="relative mx-auto grid min-h-[34rem] max-w-5xl min-w-0 items-center gap-5 px-4 pt-12 sm:px-6 sm:pt-14 lg:grid-cols-[0.94fr_1.06fr] lg:pt-0">
        <div className="relative z-20 min-w-0 pb-11 pt-2 sm:pb-13 lg:py-15">
          <div className="inline-flex items-center rounded-full border border-[#dedcff] bg-white/78 px-3.5 py-1.5 text-sm font-medium tracking-wide text-[#6d63f2] shadow-[0_8px_24px_-16px_rgba(100,91,235,0.5)] backdrop-blur dark:border-[#8b84ff]/20 dark:bg-white/5 dark:text-[#b9b5ff]">
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
              className="group inline-flex items-center gap-2 rounded-xl border border-[#e5e3f2] bg-white/78 px-5 py-3 text-sm font-semibold text-[#384056] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#d4d0ff] hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
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

        <HomeHeroVisual config={config} />
      </div>
    </section>
  );
}
