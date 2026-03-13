import Link from "next/link";
import { Github } from "lucide-react";
import { siteConfig } from "@/site.config";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </p>

        <div className="flex items-center gap-3">
          {siteConfig.social.github && (
            <Link
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
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
