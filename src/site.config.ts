export const siteConfig = {
  name: "My Blog",
  description: "个人博客",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  nav: [
    { label: "首页", href: "/" },
    { label: "博客", href: "/blog" },
    { label: "项目", href: "/projects" },
    { label: "关于", href: "/about" },
  ],

  social: {
    github: "https://github.com",
    x: "",
    email: "",
  },
} as const;
