# 首页风格 DIY

首页采用“数据查询与视觉组件分离”的结构，默认只启用主视觉和精选文章两个已有数据支撑的模块。

## 文件结构

```text
src/app/(public)/page.tsx
src/features/home/
├── components/
│   ├── home-hero.tsx
│   ├── home-featured-posts.tsx
│   └── home-section-shell.tsx
└── config/
    └── home.config.ts
public/home/
└── hero-visual.svg
```

- `page.tsx`：只负责读取数据和组合首页模块。
- `home.config.ts`：控制首页文案、按钮、文章数量和模块开关。
- `home-hero.tsx`：首页首屏布局、CSS 背景与主视觉排版。
- `home-featured-posts.tsx`：精选文章优先、最新文章兜底的文章展示区。
- `home-section-shell.tsx`：首页内容模块的统一标题和容器样式。
- `public/home/hero-visual.svg`：默认人物主视觉资源。

## 修改首页文案

编辑：

```text
src/features/home/config/home.config.ts
```

可以直接修改：

- Hero 顶部短句
- `Hi~` 问候语
- 首页主标题
- 默认介绍文案
- 两个按钮的名称和链接
- 精选文章区标题、说明和展示数量

当后台设置了站点副标题时，Hero 会优先显示后台副标题；没有副标题时才使用配置文件中的默认介绍。

## 替换主视觉

最简单的方式是直接替换：

```text
public/home/hero-visual.svg
```

保持文件名不变时，不需要修改任何组件代码。也可以放入 PNG、WebP 或其他 SVG 文件，再修改配置：

```ts
visual: {
  imageUrl: "/home/hero.webp",
  imageAlt: "我的首页主视觉",
},
```

建议使用带透明背景的素材。页面中的浅紫渐变、圆形光晕、远景层次和暗色模式背景均由 CSS 生成，不需要把背景烘焙进人物图片。

## 启用和关闭模块

当前配置预留了以下开关：

```ts
sections: {
  hero: { enabled: true },
  featuredPosts: { enabled: true },
  categories: { enabled: false },
  stats: { enabled: false },
}
```

`categories` 和 `stats` 目前只预留开关，不会渲染空白占位。后续实现对应组件后，可以在 `page.tsx` 中按相同方式组合。

## 替换整套视觉

需要完全更换风格时，建议保留 `page.tsx` 中的数据查询，只替换 `src/features/home/components` 下的视觉组件。这样不会影响文章查询、站点设置、SEO 和前台公共布局。

导航栏和页脚由以下文件统一管理，不属于首页组件：

```text
src/app/(public)/layout.tsx
```
