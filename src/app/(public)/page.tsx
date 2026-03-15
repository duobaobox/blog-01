import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="py-24 sm:py-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          你好，我是 <span className="text-primary">开发者</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          全栈开发者，热爱构建优雅的产品。这里记录我的技术思考、项目经验和学习笔记。
        </p>
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
      </section>
    </div>
  );
}
