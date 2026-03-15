import Link from "next/link";
import { Github, Mail } from "lucide-react";

interface FooterProps {
  siteName: string;
  githubUrl?: string;
  xUrl?: string;
  email?: string;
  footerText?: string;
}

export function Footer({
  siteName,
  githubUrl,
  xUrl,
  email,
  footerText,
}: FooterProps) {
  const copyrightText =
    footerText?.trim() ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">{copyrightText}</p>

        <div className="flex items-center gap-3">
          {githubUrl && (
            <Link
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          )}
          {xUrl && (
            <Link
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              X
            </Link>
          )}
          {email && (
            <Link
              href={`mailto:${email}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              <span className="sr-only">Email</span>
            </Link>
          )}
          <Link
            href="/feed.xml"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            RSS
          </Link>
        </div>
      </div>
    </footer>
  );
}
