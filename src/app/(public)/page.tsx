export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Github, Mail } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { getPosts } from "@/features/posts/queries/post.queries";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";

export default async function HomePage() {
  const [recentPosts, site] = await Promise.all([
    getPosts({ status: "published", take: 3 }),
    getResolvedSiteConfig(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* 首页头图介绍区 */}
      <section className="py-20 sm:py-28">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          你好，我是 <span className="text-primary">开发者</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          全栈开发者，热爱构建优雅的产品。这里记录我的技术思考、项目经验和学习笔记。
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            阅读博客 <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            关于我
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-4">
          {site.social.github && (
            <Link
              href={site.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </Link>
          )}
          {site.social.email && (
            <Link
              href={`mailto:${site.social.email}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* 最新文章区域 */}
      <section className="pb-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">最新文章</h2>
          <Link
            href="/blog"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            查看全部 <ArrowRight className="ml-1 inline h-3 w-3" />
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <PostsEmptyState
            title="最新文章还在整理中"
            description="第一篇文章发布后，这里会展示最近更新的内容。"
            className="py-14"
            icon={null}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20">
                  <CardHeader className="space-y-3">
                    {post.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.tags.slice(0, 2).map((pt) => (
                          <TagBadge
                            key={pt.tag.id}
                            name={pt.tag.name}
                            color={pt.tag.color}
                          />
                        ))}
                      </div>
                    )}
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed line-clamp-3">
                      {post.excerpt ??
                        post.contentMarkdown.slice(0, 100) + "..."}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("zh-CN")
                        : new Date(post.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
