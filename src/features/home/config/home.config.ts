export const homeConfig = {
  sections: {
    hero: {
      enabled: true,
      eyebrow: "记录 · 分享 · 成长",
      greeting: "Hi~",
      title: "欢迎来到我的博客",
      description: "记录设计灵感，分享学习成长，探索更多值得长期积累的内容。",
      primaryAction: {
        label: "查看最新文章",
        href: "/blog",
      },
      secondaryAction: {
        label: "了解更多",
        href: "/about",
      },
      visual: {
        // 可替换为 public 目录中的本地图片，例如 /home/hero.webp。
        // 留空时使用后台配置的站点头像生成默认主视觉。
        imageUrl: null as string | null,
        imageAlt: "博客首页主视觉",
      },
    },
    featuredPosts: {
      enabled: true,
      limit: 3,
      featuredTitle: "精选文章",
      latestTitle: "最新文章",
      description: "持续记录值得沉淀的思考、实践与创作。",
      action: {
        label: "查看全部",
        href: "/blog",
      },
    },
    // 先保留模块开关，不渲染空白占位。后续实现组件后直接启用即可。
    categories: {
      enabled: false,
    },
    stats: {
      enabled: false,
    },
  },
} as const;

export type HomeHeroConfig = typeof homeConfig.sections.hero;
export type HomeFeaturedPostsConfig = typeof homeConfig.sections.featuredPosts;
