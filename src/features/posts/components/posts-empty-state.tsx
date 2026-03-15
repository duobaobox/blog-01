import type { ReactNode } from "react";
import { FileText, type LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";

type PostsEmptyStateProps = {
  title: string;
  description: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  icon?: LucideIcon | null;
  children?: ReactNode;
};

export function PostsEmptyState({
  title,
  description,
  className,
  size = "default",
  icon: Icon = FileText,
  children,
}: PostsEmptyStateProps) {
  return (
    <Empty className={className} size={size}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}
