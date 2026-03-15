import {
  Code2,
  Lightbulb,
  BookOpen,
  Zap,
  Database,
  Layout,
  Cpu,
  Network,
  Shield,
  Palette,
  BookMarked,
  LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import type { ReactNode } from "react";

const categoryIcons: Record<string, LucideIcon> = {
  tech: Code2,
  技术: Code2,
  development: Code2,
  开发: Code2,
  frontend: Layout,
  前端: Layout,
  backend: Database,
  后端: Database,
  fullstack: Code2,
  全栈: Code2,
  idea: Lightbulb,
  想法: Lightbulb,
  learning: BookOpen,
  学习: BookOpen,
  performance: Zap,
  性能: Zap,
  database: Database,
  数据库: Database,
  design: Palette,
  设计: Palette,
  architecture: Network,
  架构: Network,
  security: Shield,
  安全: Shield,
  devops: Cpu,
  tools: Code2,
  工具: Code2,
  other: BookMarked,
  其他: BookMarked,
};

export function getCategoryIcon(categoryName: string): LucideIcon {
  const nameLower = categoryName.toLowerCase();
  return categoryIcons[nameLower] || categoryIcons[categoryName] || BookMarked;
}

export function renderCategoryIcon(
  categoryName: string,
  className?: string,
): ReactNode {
  const Icon = getCategoryIcon(categoryName);
  return createElement(Icon, { className });
}

export function getCategoryColor(index: number): string {
  // 简洁的中性配色方案，只在 hover 时有轻微背景
  const colors = [
    "text-foreground border-border hover:bg-accent/50",
    "text-foreground border-border hover:bg-accent/50",
    "text-foreground border-border hover:bg-accent/50",
    "text-foreground border-border hover:bg-accent/50",
  ];
  return colors[index % colors.length];
}
