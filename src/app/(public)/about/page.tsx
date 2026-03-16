import { Separator } from "@/shared/ui/separator";
import { generateSeo } from "@/infrastructure/seo";

export async function generateMetadata() {
  return generateSeo({
    title: "关于",
    description: "关于我 — 全栈开发者，热爱构建优雅的产品。",
    url: "/about",
  });
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">关于我</h1>
      <Separator className="my-6" />

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold">简介</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            你好！我是一名全栈开发者，专注于 Web
            技术和用户体验。我相信好的工具和优雅的代码可以让复杂的问题变得简单。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">技术栈</h2>
          <div className="mt-3 flex flex-wrap gap-2">
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
        </section>

        <section>
          <h2 className="text-xl font-semibold">这个博客</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            这个博客用于记录我的技术思考、项目经验和学习笔记。博客基于 Next.js +
            shadcn/ui + PostgreSQL 构建，追求简洁、快速和良好的阅读体验。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">联系我</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            如果你有任何问题或合作意向，欢迎通过 GitHub 或邮件联系我。
          </p>
        </section>
      </div>
    </div>
  );
}
