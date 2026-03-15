import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const emptyVariants = cva(
  "group/empty flex w-full flex-col items-center justify-center text-center",
  {
    variants: {
      size: {
        default: "gap-3",
        sm: "gap-2",
        lg: "gap-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const emptyMediaVariants = cva(
  "flex items-center justify-center overflow-hidden",
  {
    variants: {
      variant: {
        default: "rounded-lg border border-border/70 bg-background p-2",
        icon: "size-10 rounded-full border border-border/70 text-muted-foreground/80 group-data-[size=sm]/empty:size-8 group-data-[size=lg]/empty:size-11 [&_svg:not([class*='size-'])]:size-4 group-data-[size=lg]/empty:[&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Empty({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyVariants>) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      className={cn(emptyVariants({ size, className }))}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-md flex-col items-center gap-1.5", className)}
      {...props}
    />
  )
}

function EmptyMedia({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-media"
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn(
        "text-base font-medium tracking-tight text-foreground group-data-[size=sm]/empty:text-sm group-data-[size=lg]/empty:text-lg",
        className
      )}
      {...props}
    />
  )
}

function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        "max-w-sm text-sm leading-6 text-muted-foreground group-data-[size=sm]/empty:text-xs group-data-[size=sm]/empty:leading-5",
        className
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 pt-1",
        className
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
