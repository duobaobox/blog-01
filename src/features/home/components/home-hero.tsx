import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coffee, Laptop, Leaf, Sparkles } from "lucide-react";
import type { PublicPostCard } from "@/features/posts/queries/post.queries";
import { getPostDisplayDate } from "@/features/posts/lib/post-status";
import type { ResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import type { HomeHeroConfig } from "@/features/home/config/home.config";
import { formatDate } from "@/shared/lib/date";

type HomeHeroProps = {
  site: Pick<
    ResolvedSiteConfig,
    "name" | "description" | "subtitle" | "avatar"
  >;
  config: HomeHeroConfig;
  highlightedPost?: PublicPostCard;
  postSource: "featured" | "latest";
};

function HomeHeroVisual({
  site,
  config,
}: Pick<HomeHeroProps, "site" | "config">) {
  if (config.visual.imageUrl) {
    return (
      <div className="relative min-h-[22rem] w-full sm:min-h-[28rem]">
        <Image
          src={config.visual.imageUrl}
          alt={config.visual.imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 480px, 100vw"
          className="object-contain object-bottom"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-[22rem] w-full max-w-[31rem] sm:min-h-[28rem]">
      <div className="absolute inset-x-[7%] top-[8%] aspect-square rounded-full border border-primary/10 bg-background/35 shadow-inner" />
      <div className="absolute right-[4%] top-[12%] size-24 rounded-full bg-primary/10 blur-2xl sm:size-36" />
      <div className="absolute left-[3%] top-[34%] size-20 rounded-full bg-primary/10 blur-2xl sm:size-28" />

      <div className="absolute inset-x-[3%] bottom-0 h-[24%] rounded-t-[3rem] border border-b-0 border-border/60 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_82%,transparent),var(--muted))] shadow-[0_-18px_50px_-38px_var(--foreground)]" />

      <div className="absolute left-[8%] bottom-[21%] z-20 flex flex-col items-center">
        <Leaf className="size-12 -rotate-12 text-primary/70 sm:size-16" />
        <div className="h-10 w-12 rounded-b-2xl rounded-t-md border bg-background/85 shadow-sm sm:h-12 sm:w-14" />
      </div>

      <div className="absolute right-[7%] bottom-[19%] z-20 flex size-14 items-center justify-center rounded-2xl border bg-background/85 shadow-sm sm:size-16">
        <Coffee className="size-7 text-primary/70" />
      </div>

      <div className="absolute left-1/2 top-[12%] z-10 -translate-x-1/2">
        {site.avatar ? (
          <div className="relative size-48 overflow-hidden rounded-[42%] border-4 border-background/80 bg-muted shadow-xl sm:size-60">
            <Image
              src={site.avatar.url}
              alt={site.avatar.alt ?? site.name}
              width={site.avatar.width ?? 360}
              height={site.avatar.height ?? 360}
              sizes="(min-width: 640px) 240px, 192px"
              priority
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex size-48 items-center justify-center rounded-[42%] border-4 border-background/80 bg-primary/10 text-7xl font-bold text-primary shadow-xl sm:size-60">
            {site.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="absolute bottom-[17%] left-1/2 z-30 w-[58%] -translate-x-1/2">
        <div className="relative aspect-[16/10] rounded-t-2xl border border-border/80 bg-[linear-gradient(145deg,var(--card),var(--muted))] shadow-2xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <Laptop className="size-12 text-primary/65 sm:size-14" />
          </div>
        </div>
        <div className="mx-auto h-3 w-[112%] -translate-x-[5.5%] rounded-b-xl border border-t-0 bg-muted shadow-md" />
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
    <section className="relative isolate overflow-hidden border-b border-border/70 bg-[radial-gradient(circle_at_78%_24%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_34%),linear-gradient(135deg,var(--background),color-mix(in_oklab,var(--background)_88%,var(--primary)))]">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--border)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_25%,transparent)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />

      <div className="relative mx-auto grid min-h-[34rem] max-w-5xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:py-10">
        <div className="relative z-10 py-4 lg:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" />
            {config.eyebrow}
          </div>

          <p className="mt-7 text-6xl font-black tracking-[-0.06em] text-primary sm:text-7xl">
            {config.greeting}
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-black tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            {config.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={config.primaryAction.href}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="size-4" />
              {config.primaryAction.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={config.secondaryAction.href}
              className="group inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/65 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition-colors hover:bg-accent"
            >
              {config.secondaryAction.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {highlightedPost ? (
            <Link
              href={`/blog/${highlightedPost.slug}`}
              className="group mt-9 flex max-w-xl items-center gap-3 border-t border-border/70 pt-5 text-sm"
            >
              <span className="shrink-0 font-medium text-primary">
                {postSource === "featured" ? "精选推荐" : "最近更新"}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground transition-colors group-hover:text-foreground">
                {highlightedPost.title}
              </span>
              {highlightedDate ? (
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {formatDate(highlightedDate)}
                </span>
              ) : null}
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>

        <HomeHeroVisual site={site} config={config} />
      </div>
    </section>
  );
}
