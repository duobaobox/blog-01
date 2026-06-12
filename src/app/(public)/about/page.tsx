import { generateSeo } from "@/infrastructure/seo";
import {
  StaticPageSection,
  StaticPageShell,
} from "@/components/blog/static-page-shell";

export const revalidate = 300;

export async function generateMetadata() {
  return generateSeo({
    title: "关于",
    description: "关于我 — 全栈开发者，热爱构建优雅的产品。",
    url: "/about",
  });
}

export default function AboutPage() {
  return (
    <StaticPageShell title="关于我" contentClassName="space-y-8">
      <StaticPageSection title="简介">
        <p className="leading-relaxed text-muted-foreground">
          你好！我是一名全栈开发者，专注于 Web
          技术和用户体验。我相信好的工具和优雅的代码可以让复杂的问题变得简单。
        </p>
      </StaticPageSection>

      <StaticPageSection title="技术栈" contentClassName="mt-3">
        <div className="flex flex-wrap gap-2">
          {[
            "TypeScript",
            "React",
            "Next.js",
            "Node.js",
            "PostgreSQL",
            "Tailwind CSS",
            "Prisma",
            "Docker",
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </StaticPageSection>

      <StaticPageSection title="这个博客">
        <p className="leading-relaxed text-muted-foreground">
          这个博客用于记录我的技术思考、项目经验和学习笔记。博客基于 Next.js +
          shadcn/ui + PostgreSQL 构建，追求简洁、快速和良好的阅读体验。
        </p>
      </StaticPageSection>

      <StaticPageSection title="联系我">
        <p className="leading-relaxed text-muted-foreground">
          如果你有任何问题或合作意向，欢迎通过 GitHub 或邮件联系我。
        </p>
      </StaticPageSection>
    </StaticPageShell>
  );
}
