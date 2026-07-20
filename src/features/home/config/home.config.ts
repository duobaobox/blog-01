export const homeConfig = {
  sections: {
    hero: {
      enabled: true,
      eyebrow: "记录 · 分享 · 成长",
      greeting: "Hi~",
      title: "欢迎来到我的博客",
      description: "记录设计灵感，分享学习成长，探索无限可能。",
      primaryAction: {
        label: "查看最新文章",
        href: "/blog",
      },
      secondaryAction: {
        label: "了解更多",
        href: "/about",
      },
      visual: {
        light: [
          {
            imageUrl: "/home/scenes/day-work.png",
            imageAlt: "在明亮书房中专注工作的博客作者",
          },
          {
            imageUrl: "/home/scenes/day-break.png",
            imageAlt: "坐在书桌前喝咖啡放松的博客作者",
          },
          {
            imageUrl: "/home/scenes/day-window.png",
            imageAlt: "离开工位在窗边休息的博客作者",
          },
        ],
        dark: [
          {
            imageUrl: "/home/scenes/night-work.png",
            imageAlt: "夜间在书桌前专注工作的博客作者",
          },
          {
            imageUrl: "/home/scenes/night-sleep.png",
            imageAlt: "深夜趴在书桌上休息的博客作者",
          },
        ],
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
