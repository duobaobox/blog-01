import { PublicShell } from "@/components/blog/public-shell";

export const revalidate = 300;

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell surface="home">{children}</PublicShell>;
}
