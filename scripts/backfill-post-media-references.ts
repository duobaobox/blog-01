import "dotenv/config";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  buildPostMediaReferenceInputs,
  collectCandidateMediaUrls,
} from "@/features/media/lib/post-media-reference";
import { getDatabaseSchemaFromUrl } from "@/shared/lib/database-url";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const apply = process.argv.includes("--apply");
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

type ExistsRow = {
  exists: boolean;
};

type PostRow = {
  id: string;
  coverImageUrl: string | null;
  contentJson: unknown;
};

async function assertReferenceTableExists() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    const targetSchema = getDatabaseSchemaFromUrl(process.env.DATABASE_URL!);
    const [{ exists }] = (
      await client.query<ExistsRow>(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = '${targetSchema}'
            AND table_name = 'postMediaReference'
        ) AS "exists"
      `)
    ).rows;

    if (!exists) {
      throw new Error(
        `postMediaReference table does not exist in schema "${targetSchema}". Run schema sync first.`,
      );
    }
  } finally {
    await client.end();
  }
}

async function main() {
  await assertReferenceTableExists();

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      coverImageUrl: true,
      contentJson: true,
    },
    orderBy: { createdAt: "asc" },
  }) as PostRow[];

  const allCandidateUrls = new Set<string>();
  for (const post of posts) {
    for (const url of collectCandidateMediaUrls(post)) {
      allCandidateUrls.add(url);
    }
  }

  const mediaRecords = await prisma.media.findMany({
    where: {
      url: {
        in: [...allCandidateUrls],
      },
    },
    select: {
      id: true,
      url: true,
    },
  });

  const rows = posts.flatMap((post) =>
    buildPostMediaReferenceInputs(post, mediaRecords).map((reference) => ({
      postId: post.id,
      mediaId: reference.mediaId,
      usage: reference.usage,
    })),
  );

  const uniqueRows = Array.from(
    new Map(
      rows.map((row) => [`${row.postId}:${row.mediaId}:${row.usage}`, row]),
    ).values(),
  );

  console.log("Post media reference backfill plan");
  console.log(`  posts scanned: ${posts.length}`);
  console.log(`  candidate urls: ${allCandidateUrls.size}`);
  console.log(`  matched media rows: ${mediaRecords.length}`);
  console.log(`  reference rows to write: ${uniqueRows.length}`);

  if (!apply) {
    console.log("  apply: skipped (pass --apply to replace postMediaReference rows)");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.postMediaReference.deleteMany();

    if (uniqueRows.length > 0) {
      await tx.postMediaReference.createMany({
        data: uniqueRows,
      });
    }
  });

  console.log("  apply: completed");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
