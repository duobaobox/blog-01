export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, FolderOpen, Tags } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getPostCount } from "@/features/posts";
import { getCategories, getTags } from "@/features/taxonomy";

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
      icon: FileText,
      href: "/admin/posts",
    },
    { label: "草稿", value: draftCount, icon: FileText, href: "/admin/posts" },
    {
      label: "分类",
      value: categories.length,
      icon: FolderOpen,
      href: "/admin/categories",
    },
    { label: "标签", value: tags.length, icon: Tags, href: "/admin/tags" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">概览</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
