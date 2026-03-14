export const dynamic = "force-dynamic";

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
import { getPostCount } from "@/features/posts/queries/post.queries";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";

export default async function AdminDashboard() {
  const [postCount, draftCount, categories, tags] = await Promise.all([
    getPostCount("published"),
    getPostCount("draft"),
    getCategories(),
    getTags(),
  ]);

  const stats = [
    {
      label: "已发布文章",
      value: postCount,
      description: "公开可见的文章",
      icon: FileText,
      href: "/admin/posts",
    },
    {
      label: "草稿",
      value: draftCount,
      description: "未发布的草稿",
      icon: TrendingUp,
      href: "/admin/posts",
    },
    {
      label: "分类",
      value: categories.length,
      description: "内容分类数量",
      icon: FolderOpen,
      href: "/admin/categories",
    },
    {
      label: "标签",
      value: tags.length,
      description: "文章标签数量",
      icon: Tags,
      href: "/admin/tags",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1680px] p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">概览</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            站点内容数据一览
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="group">
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
      </div>
    </div>
  );
}
