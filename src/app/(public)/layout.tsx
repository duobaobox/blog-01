import { PublicShell } from "@/components/blog/public-shell";

export const revalidate = 300;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell surface="default">{children}</PublicShell>;
}
