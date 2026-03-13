import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("📊 Checking database data...\n");

  const users = await prisma.user.count();
  const posts = await prisma.post.count();
  const categories = await prisma.category.count();
  const tags = await prisma.tag.count();

  console.log(`Users: ${users}`);
  console.log(`Posts: ${posts}`);
  console.log(`Categories: ${categories}`);
  console.log(`Tags: ${tags}\n`);

  if (posts > 0) {
    console.log("📝 Recent posts:");
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
      },
    });
    recentPosts.forEach((post) => {
      console.log(
        `  - Title: ${post.title}\n    Slug: "${post.slug}"\n    Status: ${post.status}\n    URL: /blog/${post.slug}\n`,
      );
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
