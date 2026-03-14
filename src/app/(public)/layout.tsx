import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getResolvedSiteConfig();

  return (
    <div className="flex min-h-screen flex-col">
      <Header siteName={site.name} nav={site.nav} />
      <main className="flex-1">{children}</main>
      <Footer
        siteName={site.name}
        githubUrl={site.social.github}
        footerText={site.footerText}
      />
    </div>
  );
}
