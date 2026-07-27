import "dotenv/config";
import { Prisma } from "../src/generated/prisma/client.js";
import { materializePostContent } from "../src/features/editor/content-materializer-core.js";
import { db } from "../src/infrastructure/db/index.js";

const PAGE_SIZE = 100;

function parseApplyMode(args: string[]) {
  const unsupported = args.filter((arg) => arg !== "--apply");
  if (unsupported.length > 0) {
    throw new Error("Unsupported args: " + unsupported.join(", "));
  }
  return args.includes("--apply");
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function main() {
  const apply = parseApplyMode(process.argv.slice(2));
  let cursorId: string | undefined;
  let scanned = 0;
  let changed = 0;

  while (true) {
    const posts = await db.post.findMany({
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: {
        id: true,
        contentJson: true,
        contentHtml: true,
        contentText: true,
        contentToc: true,
        wordCount: true,
        readingTimeMinutes: true,
      },
    });

    if (posts.length === 0) break;

    for (const post of posts) {
      const materialized = await materializePostContent(post.contentJson);
      const needsUpdate =
        !sameJson(post.contentJson, materialized.contentJson) ||
        post.contentHtml !== materialized.contentHtml ||
        post.contentText !== materialized.contentText ||
        !sameJson(post.contentToc, materialized.contentToc) ||
        post.wordCount !== materialized.wordCount ||
        post.readingTimeMinutes !== materialized.readingTimeMinutes;

      scanned += 1;
      if (!needsUpdate) continue;
      changed += 1;

      if (apply) {
        await db.post.update({
          where: { id: post.id },
          data: {
            contentJson: materialized.contentJson as Prisma.InputJsonValue,
            contentHtml: materialized.contentHtml,
            contentText: materialized.contentText,
            contentToc: materialized.contentToc as Prisma.InputJsonValue,
            wordCount: materialized.wordCount,
            readingTimeMinutes: materialized.readingTimeMinutes,
          },
        });
      }
    }

    cursorId = posts.at(-1)?.id;
  }

  console.log(
    `Post content backfill ${apply ? "applied" : "planned"}: scanned=${scanned}, changed=${changed}`,
  );
  if (!apply && changed > 0) {
    console.log("Run again with --apply after reviewing the plan.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
