import { normalizeSiteUrl } from "@/shared/lib/url";

export const siteConfig = {
  name: "My Blog",
  description: "个人博客",
  url: normalizeSiteUrl(process.env.SITE_URL || "http://localhost:3000"),

  nav: [
    { label: "首页", href: "/" },
    { label: "博客", href: "/blog" },
    { label: "项目", href: "/projects" },
    { label: "关于", href: "/about" },
  ],

  social: {
    github: "",
    x: "",
    email: "",
  },
} as const;
