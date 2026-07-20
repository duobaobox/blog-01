# 前台页面框架与主题扩展

前台页面统一使用 `PublicShell` 组合导航栏、正文区域和页脚。页面内容不直接修改公共 `main` 的布局模式，而是由路由组布局显式选择页面主题。

## 当前结构

```text
src/app/
  (home)/
    layout.tsx        首页框架，surface="home"
    page.tsx          首页内容
  (public)/
    layout.tsx        常规框架，surface="default"
    blog/
    projects/
    about/

src/components/blog/
  public-shell.tsx    公共 Header、main、Footer 框架
```

路由组名称不会进入 URL，因此：

- `src/app/(home)/page.tsx` 仍对应 `/`
- `src/app/(public)/blog/page.tsx` 仍对应 `/blog`
- 将 `projects` 移入新的路由组后仍可保持 `/projects`

## PublicShell 扩展点

`PublicShell` 支持以下参数：

- `surface`：写入 `main[data-public-surface]`，用于选择页面背景和主题。
- `overlapHeader`：控制正文是否向上延伸到导航栏背后，默认开启。
- `className`：扩展最外层页面框架。
- `mainClassName`：扩展正文区域，但不要改变普通内容页的宽度计算方式。

首页布局示例：

```tsx
import { PublicShell } from "@/components/blog/public-shell";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell surface="home">{children}</PublicShell>;
}
```

主题样式通过显式属性声明：

```css
.public-main[data-public-surface="home"] {
  background: ...;
}

.dark .public-main[data-public-surface="home"] {
  background: ...;
}
```

## 为项目页增加独立设计

当项目页需要完全独立的背景和页面外壳时：

1. 新建 `src/app/(projects)/layout.tsx`。
2. 将 `src/app/(public)/projects` 移到 `src/app/(projects)/projects`。
3. 在新布局中使用 `<PublicShell surface="projects">`。
4. 在全局样式中新增 `[data-public-surface="projects"]` 的明暗主题。
5. 保持 `projects/page.tsx` 只负责页面内容。

```tsx
import { PublicShell } from "@/components/blog/public-shell";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicShell
      surface="projects"
      overlapHeader={false}
      mainClassName="bg-background"
    >
      {children}
    </PublicShell>
  );
}
```

`PublicSurface` 接受内置的 `default`、`home` 以及自定义字符串，因此新增主题不需要修改公共框架实现。

## 维护约束

- 不通过 `:has()`、路径判断或客户端副作用反向修改公共布局。
- 不为了页面背景把公共 `main` 改为 Flex 或 Grid；这会改变带 `mx-auto` 页面容器的宽度计算。
- 页面独立设计优先新增路由组布局和 surface，不复制 Header、Footer 或站点设置查询。
- 背景、主题和页面外壳属于布局；具体 Hero、文章列表和静态内容属于页面或 feature 组件。
- 新增路由组后检查 URL 未变化，并执行 `npm run lint`、`npm test` 和 `npm run build`。


## 首页 Hero 场景

首页主视觉使用按明暗主题分组的透明 PNG 场景，并在客户端完成随机选择。素材路径、替换方式和扩展约定见 [`home-hero-scenes.md`](./home-hero-scenes.md)。
