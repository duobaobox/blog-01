import { Header } from "@/shared/ui/header";
import { Footer } from "@/shared/ui/footer";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";

export const revalidate = 300;

/**
 * 网站公共页面对应的通用布局模块
 * 所有属于 (public) 路由组的页面（如：首页、博客列表页、关于我等）都会自动套用此布局框架。
 *
 * @param children - 具体各个页面组件的内容 (Next.js 路由自动传入)
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 从服务端获取最新的站点配置信息（例如名称、Logo、底部文本、社交媒体链接等）
  const site = await getResolvedSiteConfig();

  return (
    // 外层容器：使用 Flex 垂直布局，并设置最小高度为满屏幕 (min-h-screen)，
    // 确保当页面中间内容较少时，Footer 依然能保持在页面最底部而不会浮层悬空。
    <div className="flex min-h-dvh min-w-0 flex-col">
      {/* 网站顶部导航栏：展示 Logo、站点名称和各类导航菜单 */}
      <Header siteName={site.name} logo={site.logo} nav={site.nav} />
      
      {/* 网站主体内容：flex-1 会自适应撑满 Header 和 Footer 之间的全部剩余屏幕空间 */}
      <main className="public-main min-w-0 flex-1 -mt-14">{children}</main>
      
      {/* 网站底部信息栏：展示版权声明、社交账号链接等尾部文本 */}
      <Footer
        siteName={site.name}
        githubUrl={site.social.github}
        xUrl={site.social.x}
        email={site.social.email}
        footerText={site.footerText}
      />
    </div>
  );
}
