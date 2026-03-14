import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Github } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";

export const metadata: Metadata = {
  title: "项目",
  description: "我的开源项目和个人作品集。",
};

const projects = [
  {
    name: "个人博客",
    description: "基于 Next.js + shadcn/ui + PostgreSQL 的全栈个人博客系统。",
    tags: ["Next.js", "TypeScript", "Prisma"],
    repo: "https://github.com",
    demo: null,
  },
  {
    name: "CLI 工具",
    description: "一个提升开发效率的命令行工具集。",
    tags: ["Node.js", "CLI"],
    repo: "https://github.com",
    demo: null,
  },
  {
    name: "设计系统",
    description: "基于 Tailwind CSS 的组件库和设计令牌系统。",
    tags: ["React", "Tailwind CSS", "Storybook"],
    repo: "https://github.com",
    demo: "https://example.com",
  },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">项目</h1>
      <p className="mt-2 text-muted-foreground">
        我的开源项目和个人作品。
      </p>
      <Separator className="my-6" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="mb-4 flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {project.repo && (
                  <Link
                    href={project.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Github className="h-4 w-4" />
                    Source
                  </Link>
                )}
                {project.demo && (
                  <Link
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Demo
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
