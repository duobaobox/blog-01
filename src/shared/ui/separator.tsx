import * as React from "react";

import { cn } from "@/shared/lib/utils";

type SeparatorProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
};

/**
 * 纯静态分隔线，用服务端组件实现。
 *
 * 之前包的是 base-ui 的 Separator——一个客户端组件，会把 base-ui 的运行时
 * 带进每个公开页面的客户端清单，而这里实际只需要一个带 `role="separator"` 的 div。
 *
 * `data-orientation` 必须保留：Tailwind v4 把 `data-horizontal:` / `data-vertical:`
 * 编译成 `[data-orientation=...]`，去掉它线就会没有高度。
 */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-slot="separator"
      data-orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
