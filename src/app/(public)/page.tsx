import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PostListCard } from "@/features/posts/components/post-list-card";
import { getHomepageFeaturedOrLatestPosts } from "@/features/posts/queries/post.queries";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { generateSeo } from "@/infrastructure/seo";
import { StaticPageContainer } from "@/components/blog/static-page-shell";

export const revalidate = 300;

/**
 * 动态生成首页的 SEO 元数据 (Meta Tags)
 * 提升网站在搜索引擎和社交分享中的展示效果和抓取权重。
 */
export async function generateMetadata() {
  return generateSeo({ url: "/" });
}

/**
 * 网站核心首页组件
 * 采用 React Server Component (SSR，服务端组件) 在服务端直接读取数据并渲染页面。
 */
export default async function HomePage() {
  const sitePromise = getResolvedSiteConfig();
  const homepagePostsPromise = getHomepageFeaturedOrLatestPosts(3);

  const [site, homepagePosts] = await Promise.all([
    sitePromise,
    homepagePostsPromise,
  ]);
  const latestPosts = homepagePosts.posts;
  const showingFeaturedPosts = homepagePosts.source === "featured";

  return (
    // 套用静态通栏样式的页面容器
    <StaticPageContainer className="py-0">
      
      {/* ===================== Hero 区域: 个站/博主门面信息展示 ===================== */}
      <section className="grid gap-10 py-20 sm:grid-cols-[1fr_180px] sm:items-center sm:py-28">
        <div>
          {/* 大标题 */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            你好，我是 <span className="text-primary">{site.name}</span>
          </h1>
          {/* 副标题或者详细描述 */}
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {site.subtitle || site.description}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            这里会同步展示后台设定的站点信息，以及我最近发布或置顶的内容。
          </p>
          
          {/* 快捷操作区 / 路由跳转按钮组 */}
          <div className="mt-8 flex gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              阅读博客 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              关于我
            </Link>
          </div>
        </div>

        {/* 右侧头像展示区，响应式布局（手机端居左在最前面，桌面端靠右展示） */}
        <div className="flex justify-start sm:justify-end">
          {site.avatar ? (
            <Image
              src={site.avatar.url}
              alt={site.avatar.alt ?? site.name}
              width={site.avatar.width ?? 160}
              height={site.avatar.height ?? 160}
              sizes="(min-width: 640px) 160px, 128px"
              className="h-32 w-32 rounded-3xl border object-cover shadow-sm sm:h-40 sm:w-40"
            />
          ) : (
            // 如果博主没有设置头像（站长配置空包），则在此处生成一个首字母字符的占位方块
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl border bg-muted text-4xl font-semibold text-primary shadow-sm sm:h-40 sm:w-40">
              {site.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </section>

      {/* ===================== 博客文章列表展示区域 ===================== */}
      {/* 只有查询到的文章数据（精选或者最新）长度大于0 时，整个展示区段才会渲染出来供用户查看 */}
      {latestPosts.length > 0 ? (
        <section className="pb-20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {/* 动态计算展示的标题语境：取决于上方第2步和第3步最终检索到的是精选文章还是兜底文章 */}
                {showingFeaturedPosts ? "精选文章" : "最新文章"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                后台置顶和已发布的内容会优先出现在这里。
              </p>
            </div>
            {/* 引导访客去往全部博客列表页面看更多 */}
            <Link
              href="/blog"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              查看全部
            </Link>
          </div>

          {/* 文章卡片使用响应式网格进行布局展示 (手机竖排1列, 平板横排2列, 桌面大屏横排3列) */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {latestPosts.map((post) => (
              <PostListCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}
    </StaticPageContainer>
  );
}
