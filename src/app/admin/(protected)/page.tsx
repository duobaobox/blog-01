import Link from "next/link";
import { FileText, FolderOpen, Tags, TrendingUp } from "lucide-react";
import { AdminPage } from "@/components/admin/admin-page";
import { getAdminDashboardPageData } from "@/features/posts/queries/post.queries";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const DASHBOARD_STAT_ICONS = {
  post: FileText,
  folder: FolderOpen,
  tag: Tags,
  trend: TrendingUp,
} as const;

function getAdminPostHref(post: {
  id: string;
  folder?: { id: string } | null;
}) {
  const folderQuery = post.folder?.id ? `folder=${post.folder.id}&` : "";
  return `/admin/posts?${folderQuery}postId=${post.id}`;
}

function getPostDisplayTitle(title: string) {
  return title.trim() || "未命名文章";
}

export default async function AdminDashboard() {
  const dashboard = await getAdminDashboardPageData();
  const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AdminPage title="概览" description="站点内容数据一览">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.statCards.map((stat) => {
          const Icon = DASHBOARD_STAT_ICONS[stat.iconKey];

          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group h-full"
            >
              <Card className="h-full transition-all hover:shadow-md group-hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardDescription className="text-sm font-medium">
                    {stat.label}
                  </CardDescription>
                  <CardAction>
                    <div className="rounded-md bg-muted p-1.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardAction>
                  <CardTitle className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mt-1 text-xs">
                    {stat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">继续写作</CardTitle>
            <CardDescription>最近更新的一篇内部文章</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.continueWriting ? (
              <Link
                href={getAdminPostHref(dashboard.continueWriting)}
                className="block rounded-lg border bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
              >
                <p className="truncate text-sm font-medium">
                  {getPostDisplayTitle(dashboard.continueWriting.title)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {dashboard.continueWriting.folder?.name ?? "未归属文件夹"}
                  {" · "}
                  {dashboard.continueWriting.wordCount ?? 0} 字
                  {" · "}
                  {dateTimeFormatter.format(
                    new Date(dashboard.continueWriting.updatedAt),
                  )}
                </p>
              </Link>
            ) : (
              <div className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                暂无内部文章。
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">最近发布</CardTitle>
            <CardDescription>最近发布的 3 篇文章</CardDescription>
            <CardAction>
              <Link
                href="/admin/posts?status=published"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                查看全部
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {dashboard.recentPublished.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                还没有已发布文章。
              </div>
            ) : (
              <div>
                {dashboard.recentPublished.map((post) => (
                  <Link
                    key={post.id}
                    href={getAdminPostHref(post)}
                    className="group flex items-center justify-between gap-4 border-b py-2.5 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <span className="min-w-0 truncate text-sm font-medium group-hover:underline">
                      {getPostDisplayTitle(post.title)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {post.publishedAt
                        ? dateTimeFormatter.format(new Date(post.publishedAt))
                        : "未记录时间"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
