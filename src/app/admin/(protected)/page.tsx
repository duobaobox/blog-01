import Link from "next/link";
import { FileText, FolderOpen, Tags, TrendingUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/shared/ui/card";
import { getAdminDashboardPageData } from "@/features/posts/queries/post.queries";

const DASHBOARD_STAT_ICONS = {
  post: FileText,
  folder: FolderOpen,
  tag: Tags,
  trend: TrendingUp,
} as const;

function resolveStatHref(href: string) {
  return href.startsWith("/admin/posts") ? "/admin/posts" : href;
}

export default async function AdminDashboard() {
  const dashboard = await getAdminDashboardPageData(8);

  const activityTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1680px] p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">概览</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            站点内容数据一览
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          {dashboard.statCards.map((stat) => {
            const Icon = DASHBOARD_STAT_ICONS[stat.iconKey];
            return (
              <Link
                key={stat.label}
                href={resolveStatHref(stat.href)}
                className="group"
              >
                <Card className="transition-all hover:shadow-md group-hover:border-primary/50">
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

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>最近操作</CardTitle>
              <CardDescription>
                仅记录手动保存、发布等主动操作。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  还没有内容操作记录。
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboard.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.summary}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.author?.name ||
                            item.author?.username ||
                            item.author?.email ||
                            "管理员"}{" "}
                          · {activityTimeFormatter.format(new Date(item.createdAt))}
                        </p>
                      </div>
                      {item.post ? (
                        <Link
                          href={`/admin/posts?postId=${item.post.id}`}
                          className="shrink-0 text-xs text-primary hover:underline"
                        >
                          查看文章
                        </Link>
                      ) : (
                        <Link
                          href="/admin/posts"
                          className="shrink-0 text-xs text-primary hover:underline"
                        >
                          查看文章管理
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
