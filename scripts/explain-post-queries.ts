import "dotenv/config";
import { Prisma } from "../src/generated/prisma/client.js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const ACTIVE_POST_STATUSES = ["draft", "review", "published"] as const;
const analyzeMode = process.argv.includes("--analyze");

type ExplainRow = {
  "QUERY PLAN": string;
};

async function printExplain(title: string, query: Prisma.Sql) {
  console.log(`\n=== ${title} ===`);
  const explainPrefix = analyzeMode
    ? Prisma.sql`EXPLAIN (ANALYZE, BUFFERS)`
    : Prisma.sql`EXPLAIN`;
  const rows = await prisma.$queryRaw<ExplainRow[]>(
    Prisma.sql`${explainPrefix} ${query}`,
  );
  for (const row of rows) {
    console.log(row["QUERY PLAN"]);
  }
}

async function main() {
  console.log(
    analyzeMode
      ? "Running EXPLAIN ANALYZE with BUFFERS for posts query baselines..."
      : "Running EXPLAIN for posts query baselines...",
  );

  const activeStatusesSql = Prisma.join(
    ACTIVE_POST_STATUSES.map((status) => Prisma.sql`${status}`),
  );
  await printExplain(
    "Admin folder feed: active posts ordered for the current notebook",
    Prisma.sql`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.status,
        p."updatedAt"
      FROM "post" p
      WHERE p.status IN (${activeStatusesSql})
        AND p."folderId" = (
          SELECT f.id
          FROM "folder" f
          ORDER BY f."sortOrder" ASC, f."createdAt" ASC
          LIMIT 1
        )
      ORDER BY p."createdAt" DESC
      LIMIT 20
    `,
  );
  await printExplain(
    "Public blog feed: published posts ordered by feature and publish time",
    Prisma.sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p."isFeatured",
        p."publishedAt"
      FROM "post" p
      WHERE p.status = 'published'
      ORDER BY p."isFeatured" DESC, p."publishedAt" DESC, p."createdAt" DESC
      LIMIT 10
    `,
  );

  await printExplain(
    "Admin metrics snapshot: active counts and governance debt scan",
    Prisma.sql`
      WITH post_tag_counts AS (
        SELECT
          pt."postId",
          COUNT(*) AS "tagCount"
        FROM "postTag" pt
        GROUP BY pt."postId"
      )
      SELECT
        COUNT(*) FILTER (WHERE p.status = 'draft') AS "drafts",
        COUNT(*) FILTER (WHERE p.status = 'review') AS "review",
        COUNT(*) FILTER (WHERE p.status = 'published') AS "published",
        COUNT(*) FILTER (WHERE p.status = 'archived') AS "archived",
        COUNT(*) FILTER (
          WHERE p.status IN (${activeStatusesSql})
            AND p."categoryId" IS NULL
        ) AS "uncategorized",
        COUNT(*) FILTER (
          WHERE p.status IN (${activeStatusesSql})
            AND COALESCE(ptc."tagCount", 0) = 0
        ) AS "untagged",
        COUNT(*) FILTER (
          WHERE p.status IN (${activeStatusesSql})
            AND p."folderId" IS NULL
        ) AS "unfiled",
        COUNT(*) FILTER (
          WHERE p.status IN (${activeStatusesSql})
            AND COALESCE(p.excerpt, '') = ''
        ) AS "missingExcerpt",
        COUNT(*) FILTER (
          WHERE p.status IN (${activeStatusesSql})
            AND COALESCE(p."seoTitle", '') = ''
        ) AS "missingSeoTitle",
        COUNT(*) FILTER (
          WHERE p.status IN (${activeStatusesSql})
            AND COALESCE(p."seoDescription", '') = ''
        ) AS "missingSeoDescription"
      FROM "post" p
      LEFT JOIN post_tag_counts ptc
        ON ptc."postId" = p.id
    `,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
