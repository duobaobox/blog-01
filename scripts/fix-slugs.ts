import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import slugify from "slugify";
import { pinyin } from "pinyin-pro";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function generateSlug(title: string): string {
  // First try to slugify directly
  let slug = slugify(title, { lower: true, strict: true });

  // If slug is empty (pure Chinese), convert to pinyin first
  if (!slug) {
    const pinyinText = pinyin(title, { toneType: "none", separator: "-" });
    slug = slugify(pinyinText, { lower: true, strict: true });
  }

  // If still empty, use a timestamp
  if (!slug) {
    slug = `post-${Date.now()}`;
  }

  return slug;
}

async function main() {
  console.log("🔧 Fixing post slugs...\n");

  const posts = await prisma.post.findMany({
    select: { id: true, title: true, slug: true },
  });

  for (const post of posts) {
    // Generate a proper URL-friendly slug from the title
    const newSlug = generateSlug(post.title);

    if (newSlug !== post.slug) {
      console.log(`Updating: "${post.title}"`);
      console.log(`  Old slug: "${post.slug}"`);
      console.log(`  New slug: "${newSlug}"`);

      try {
        await prisma.post.update({
          where: { id: post.id },
          data: { slug: newSlug },
        });
        console.log(`  ✓ Updated\n`);
      } catch {
        // If slug already exists, add a number suffix
        let counter = 1;
        let uniqueSlug = newSlug;
        while (true) {
          try {
            uniqueSlug = `${newSlug}-${counter}`;
            await prisma.post.update({
              where: { id: post.id },
              data: { slug: uniqueSlug },
            });
            console.log(`  ✓ Updated with slug: "${uniqueSlug}"\n`);
            break;
          } catch {
            counter++;
            if (counter > 100) {
              console.log(`  ✗ Failed after 100 retries\n`);
              break;
            }
          }
        }
      }
    }
  }

  console.log("✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
