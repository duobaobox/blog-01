import "dotenv/config";
import readingTime from "reading-time";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";

type DemoPostSeed = {
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  topicSlug: string;
  subtopicSlug: string;
  tagSlugs: string[];
  status: "published" | "draft";
  isFeatured: boolean;
  publishedDaysAgo: number | null;
  createdDaysAgo: number;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

const topics = [
  {
    name: "内容系统",
    slug: "content-system",
    description: "围绕写作、发布和增长建立的内容知识体系。",
    sortOrder: 1,
    subtopics: [
      {
        name: "发布流程",
        slug: "publishing-flow",
        description: "草稿、校对、发布与前台回归相关内容。",
        sortOrder: 1,
      },
      {
        name: "增长策略",
        slug: "growth-strategy",
        description: "SEO、摘要、专题组织和内容增长。",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "工程实践",
    slug: "engineering-practice",
    description: "博客工程实现、部署和前端技术实践。",
    sortOrder: 2,
    subtopics: [
      {
        name: "Next.js 博客",
        slug: "nextjs-blog",
        description: "围绕博客前台、渲染和分页的工程实践。",
        sortOrder: 1,
      },
      {
        name: "Docker 部署",
        slug: "docker-delivery",
        description: "容器化部署、发布检查与运维实践。",
        sortOrder: 2,
      },
    ],
  },
] as const;

const categories = [
  { name: "产品设计", slug: "product-design", description: "产品体验、界面策略与交互设计。" },
  { name: "前端工程", slug: "frontend-engineering", description: "React、Next.js 与前端性能优化实践。" },
  { name: "内容运营", slug: "content-ops", description: "博客内容规划、发布节奏和读者增长。" },
  { name: "部署运维", slug: "devops", description: "Docker、构建发布和基础设施配置。" },
] as const;

const tags = [
  { name: "Next.js", slug: "nextjs", color: "#111827" },
  { name: "React", slug: "react", color: "#2563eb" },
  { name: "性能优化", slug: "performance", color: "#16a34a" },
  { name: "后台体验", slug: "admin-ux", color: "#9333ea" },
  { name: "内容策略", slug: "content-strategy", color: "#ea580c" },
  { name: "Docker", slug: "docker", color: "#0ea5e9" },
  { name: "SEO", slug: "seo", color: "#dc2626" },
  { name: "测试数据", slug: "demo-data", color: "#64748b" },
] as const;

const demoPosts: DemoPostSeed[] = [
  {
    title: "用 3 个界面动作把博客后台的发布效率拉起来",
    slug: "demo-admin-publishing-workflow",
    excerpt: "从草稿、预览到发布，梳理最影响效率的后台动作，方便测试文章管理流。",
    categorySlug: "product-design",
    topicSlug: "content-system",
    subtopicSlug: "publishing-flow",
    tagSlugs: ["admin-ux", "content-strategy", "demo-data"],
    status: "published",
    isFeatured: true,
    publishedDaysAgo: 2,
    createdDaysAgo: 3,
    sections: [
      {
        heading: "为什么先优化发布链路",
        paragraphs: [
          "对于个人博客来说，真正会反复使用的不是首页，而是后台写作和发布流程。每多一次跳转、多一次确认、多一次重复输入，都会直接影响更新频率。",
          "测试后台时，最值得验证的是列表筛选、编辑保存、状态切换和前台同步展示是否连贯。只要这条链路顺畅，后续再做视觉和细节优化就会更稳。",
        ],
      },
      {
        heading: "这篇测试文章要覆盖什么",
        paragraphs: [
          "我们会刻意让文章具有分类、标签、摘要和精选状态，方便一次验证前台列表、详情页、分类页、标签页和后台筛选。",
        ],
        bullets: ["后台列表可检索标题", "文章详情能展示目录", "首页精选区有内容"],
      },
    ],
  },
  {
    title: "给博客首页做一次更稳的精选文章编排",
    slug: "demo-homepage-featured-layout",
    excerpt: "精选文章不只是放三篇内容，更需要验证排序、封面和文案节奏。",
    categorySlug: "product-design",
    topicSlug: "content-system",
    subtopicSlug: "growth-strategy",
    tagSlugs: ["content-strategy", "seo", "demo-data"],
    status: "published",
    isFeatured: true,
    publishedDaysAgo: 4,
    createdDaysAgo: 5,
    sections: [
      {
        heading: "精选区的角色",
        paragraphs: [
          "精选区承担的是站点的第一印象，它既要让老读者快速看到重点，也要让新访客理解这个博客在写什么。",
          "因此测试数据里最好同时包含不同主题的文章，避免首页看上去只有一种内容类型。",
        ],
      },
      {
        heading: "验证重点",
        paragraphs: [
          "这里最适合检查图片比例、标题长度、摘要截断和时间信息是否协调。如果其中任何一块表现不好，真实内容上线后也会被放大。",
        ],
      },
    ],
  },
  {
    title: "把分类页做成真正可浏览的内容入口",
    slug: "demo-category-browsing-entry",
    excerpt: "分类页不只是一个过滤结果页，它应该有足够清晰的浏览结构。",
    categorySlug: "content-ops",
    topicSlug: "content-system",
    subtopicSlug: "growth-strategy",
    tagSlugs: ["content-strategy", "seo", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 6,
    createdDaysAgo: 7,
    sections: [
      {
        heading: "分类页常见问题",
        paragraphs: [
          "很多博客的分类页只有标题和文章列表，缺少描述和层次感，导致用户点进去之后很快失去继续浏览的动机。",
        ],
      },
      {
        heading: "为什么测试时要多分类",
        paragraphs: [
          "如果数据库里只有一种分类，分类页的很多问题是看不出来的。增加几组不同主题文章后，分页、标题层级和内容密度才更容易暴露问题。",
        ],
      },
    ],
  },
  {
    title: "标签页该怎么测，才能知道筛选真的有价值",
    slug: "demo-tag-filter-value",
    excerpt: "标签是跨分类组织内容的方式，测试时要刻意制造交叉内容。",
    categorySlug: "content-ops",
    topicSlug: "content-system",
    subtopicSlug: "growth-strategy",
    tagSlugs: ["content-strategy", "admin-ux", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 8,
    createdDaysAgo: 9,
    sections: [
      {
        heading: "交叉标签的意义",
        paragraphs: [
          "标签页最怕的数据问题就是每个标签只关联一篇文章，因为那样基本测不出排序、分页和推荐逻辑。",
          "所以这批测试数据会让多个标签重复出现在不同分类文章里，方便你直接观察列表组织方式。",
        ],
      },
    ],
  },
  {
    title: "Next.js 博客分页该怎么做，用户体验才不会碎",
    slug: "demo-nextjs-blog-pagination",
    excerpt: "分页不是单纯把数据切开，更重要的是保留位置感和继续浏览的意愿。",
    categorySlug: "frontend-engineering",
    topicSlug: "engineering-practice",
    subtopicSlug: "nextjs-blog",
    tagSlugs: ["nextjs", "react", "performance", "demo-data"],
    status: "published",
    isFeatured: true,
    publishedDaysAgo: 10,
    createdDaysAgo: 11,
    sections: [
      {
        heading: "分页最核心的事",
        paragraphs: [
          "用户在翻页时最需要的是确认自己没有迷路，所以页码、上下页、当前状态和链接结构都要足够明确。",
          "测试时最好准备超过一页的数据，并且让第二页也有足够代表性的文章，这样才不会只看到空壳分页。",
        ],
      },
      {
        heading: "怎么验证这次分页改动",
        paragraphs: [
          "你可以从博客列表进入第二页，再随机点进详情页，然后回退确认页码状态是否保持。这比只看第一页更能说明真实体验。",
        ],
      },
    ],
  },
  {
    title: "React 内容页里，长文章渲染需要关注哪些细节",
    slug: "demo-react-longform-rendering",
    excerpt: "长内容最容易出现的是标题层级、段落节奏和代码块渲染问题。",
    categorySlug: "frontend-engineering",
    topicSlug: "engineering-practice",
    subtopicSlug: "nextjs-blog",
    tagSlugs: ["react", "performance", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 12,
    createdDaysAgo: 13,
    sections: [
      {
        heading: "长文不是把字堆上去",
        paragraphs: [
          "一篇长文如果没有合适的标题结构，读者在移动端尤其容易失去阅读方向。目录、段落间距和强调信息的位置都需要被一起验证。",
        ],
        bullets: ["二级标题是否生成目录", "长段落是否易读", "移动端行宽是否合理"],
      },
      {
        heading: "测试价值",
        paragraphs: [
          "这类内容很适合拿来观察文章详情页的排版稳定性，也方便检查目录浮动逻辑是否正常。",
        ],
      },
    ],
  },
  {
    title: "后台搜索不准的时候，用户会在哪一步放弃",
    slug: "demo-admin-search-behavior",
    excerpt: "搜索命中不稳定时，后台体验会明显下降，这篇文章方便你测试标题和标签搜索。",
    categorySlug: "product-design",
    topicSlug: "content-system",
    subtopicSlug: "publishing-flow",
    tagSlugs: ["admin-ux", "content-strategy", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 14,
    createdDaysAgo: 15,
    sections: [
      {
        heading: "搜索体验不是一个输入框",
        paragraphs: [
          "后台搜索真正要解决的是定位速度。标题、摘要、正文、分类和标签是否都可检索，会直接影响找回旧文章的效率。",
        ],
      },
      {
        heading: "这篇文章怎么测",
        paragraphs: [
          "你可以在后台文章页搜索“搜索”“后台”或“标签”，观察结果数量和排序是否符合直觉。",
        ],
      },
    ],
  },
  {
    title: "内容运营里，为什么要提前设计摘要和 SEO 描述",
    slug: "demo-seo-excerpt-structure",
    excerpt: "摘要和 SEO 描述虽然短，但会同时影响站内浏览和搜索入口的点击率。",
    categorySlug: "content-ops",
    topicSlug: "content-system",
    subtopicSlug: "growth-strategy",
    tagSlugs: ["seo", "content-strategy", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 16,
    createdDaysAgo: 17,
    sections: [
      {
        heading: "摘要的双重职责",
        paragraphs: [
          "摘要既是列表页的浏览钩子，也是未来做搜索展示和分享卡片时的重要文案来源。测试数据里保留不同长度的摘要，可以更快发现截断问题。",
        ],
      },
    ],
  },
  {
    title: "Docker 部署博客时，最常踩的不是构建，而是数据初始化",
    slug: "demo-docker-bootstrap-flow",
    excerpt: "在容器化环境里，数据库、迁移和种子数据的顺序比构建本身更容易出问题。",
    categorySlug: "devops",
    topicSlug: "engineering-practice",
    subtopicSlug: "docker-delivery",
    tagSlugs: ["docker", "nextjs", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 18,
    createdDaysAgo: 19,
    sections: [
      {
        heading: "为什么初始化步骤更容易翻车",
        paragraphs: [
          "应用容器能启动，不代表数据库已经准备好；数据库可连，也不代表数据结构已经同步。这些前后顺序问题往往只会在真实部署里暴露。",
        ],
      },
      {
        heading: "测试建议",
        paragraphs: [
          "这类文章可以帮助你确认运维向内容也能被前台正常展示，同时让分类页和标签页的主题更加丰富。",
        ],
      },
    ],
  },
  {
    title: "把构建日志读顺，发布问题会少一半",
    slug: "demo-build-log-debugging",
    excerpt: "构建失败时，最有效的方式通常不是反复重试，而是先把日志层次读清楚。",
    categorySlug: "devops",
    topicSlug: "engineering-practice",
    subtopicSlug: "docker-delivery",
    tagSlugs: ["docker", "performance", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 20,
    createdDaysAgo: 21,
    sections: [
      {
        heading: "日志优先级",
        paragraphs: [
          "先看第一处真正导致失败的错误，再看后续连锁报错，是定位构建问题最省时间的方式。这个思路同样适用于前端运行时和后台操作异常。",
        ],
      },
    ],
  },
  {
    title: "给博客做一轮发布前检查，到底该看什么",
    slug: "demo-release-checklist",
    excerpt: "发版前检查不应该只是“能打开”，而要覆盖页面、数据和后台操作。",
    categorySlug: "devops",
    topicSlug: "engineering-practice",
    subtopicSlug: "docker-delivery",
    tagSlugs: ["docker", "seo", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 22,
    createdDaysAgo: 23,
    sections: [
      {
        heading: "检查顺序",
        paragraphs: [
          "最合理的顺序通常是容器状态、基础路由、后台登录、文章发布、前台回归。按这个顺序检查，能更快发现是系统性问题还是单点功能问题。",
        ],
        bullets: ["服务是否启动", "后台是否可进", "文章是否能发布", "前台是否能看到"],
      },
    ],
  },
  {
    title: "一篇草稿在发布前，应该经历哪些内容检查",
    slug: "demo-draft-review-checklist",
    excerpt: "草稿文章适合用来测试后台状态筛选、编辑回填和保存行为。",
    categorySlug: "content-ops",
    topicSlug: "content-system",
    subtopicSlug: "publishing-flow",
    tagSlugs: ["content-strategy", "admin-ux", "demo-data"],
    status: "draft",
    isFeatured: false,
    publishedDaysAgo: null,
    createdDaysAgo: 1,
    sections: [
      {
        heading: "草稿的价值",
        paragraphs: [
          "不是每篇文章都要立即发布。草稿状态可以帮助你测试后台的状态过滤、最近修改时间和编辑回填逻辑。",
        ],
      },
      {
        heading: "这篇文章适合怎么测",
        paragraphs: [
          "你可以在后台筛选草稿，打开这篇文章修改标题或摘要，再保存并返回列表，看状态和内容是否保持一致。",
        ],
      },
    ],
  },
  {
    title: "准备中的专题页：把内容结构先搭出来再慢慢填",
    slug: "demo-draft-topic-page",
    excerpt: "另一篇草稿，用来验证多草稿场景下的分页和搜索表现。",
    categorySlug: "product-design",
    topicSlug: "content-system",
    subtopicSlug: "publishing-flow",
    tagSlugs: ["admin-ux", "demo-data"],
    status: "draft",
    isFeatured: false,
    publishedDaysAgo: null,
    createdDaysAgo: 4,
    sections: [
      {
        heading: "先搭骨架",
        paragraphs: [
          "专题内容通常不会一次写完，所以更需要确认后台在处理半成品内容时是否稳定，尤其是保存、搜索和再次打开编辑。",
        ],
      },
    ],
  },
];

function daysAgo(days: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildContentJson(seed: DemoPostSeed) {
  return {
    type: "doc",
    content: seed.sections.flatMap((section, index) => {
      const nodes: Array<Record<string, unknown>> = [
        {
          type: "heading",
          attrs: { level: 2, id: `section-${index + 1}` },
          content: [{ type: "text", text: section.heading }],
        },
        ...section.paragraphs.map((paragraph) => ({
          type: "paragraph",
          content: [{ type: "text", text: paragraph }],
        })),
      ];

      if (section.bullets?.length) {
        nodes.push({
          type: "bulletList",
          content: section.bullets.map((bullet) => ({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: bullet }],
              },
            ],
          })),
        });
      }

      return nodes;
    }),
  };
}

function buildToc(seed: DemoPostSeed) {
  return seed.sections.map((section, index) => ({
    id: `section-${index + 1}`,
    title: section.heading,
    level: 2,
  }));
}

function buildContentHtml(seed: DemoPostSeed) {
  return seed.sections
    .map((section, index) => {
      const paragraphs = section.paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");

      const bullets = section.bullets?.length
        ? `<ul>${section.bullets
            .map((bullet) => `<li><p>${escapeHtml(bullet)}</p></li>`)
            .join("")}</ul>`
        : "";

      return `<h2 id="section-${index + 1}">${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}`;
    })
    .join("");
}

function buildContentText(seed: DemoPostSeed) {
  return seed.sections
    .flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets ?? []),
    ])
    .join("\n\n");
}

async function main() {
  console.log("Seeding demo posts...");

  const adminUser =
    (await db.user.findUnique({
      where: { email: process.env.SEED_ADMIN_EMAIL || "admin@example.com" },
      select: { id: true, email: true },
    })) ||
    (await db.user.findFirst({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true },
    }));

  if (!adminUser) {
    throw new Error("No admin user found. Please create an admin account first.");
  }

  console.log(`Using admin author: ${adminUser.email}`);

  const subtopicMap = new Map<string, string>();
  for (const topic of topics) {
    const savedTopic = await db.topic.upsert({
      where: { slug: topic.slug },
      update: {
        name: topic.name,
        description: topic.description,
        sortOrder: topic.sortOrder,
      },
      create: {
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        sortOrder: topic.sortOrder,
      },
      select: { id: true, slug: true },
    });

    for (const subtopic of topic.subtopics) {
      const savedSubtopic = await db.subtopic.upsert({
        where: {
          topicId_slug: {
            topicId: savedTopic.id,
            slug: subtopic.slug,
          },
        },
        update: {
          name: subtopic.name,
          description: subtopic.description,
          sortOrder: subtopic.sortOrder,
        },
        create: {
          topicId: savedTopic.id,
          name: subtopic.name,
          slug: subtopic.slug,
          description: subtopic.description,
          sortOrder: subtopic.sortOrder,
        },
        select: { id: true, slug: true },
      });

      subtopicMap.set(`${savedTopic.slug}/${savedSubtopic.slug}`, savedSubtopic.id);
    }
  }

  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const saved = await db.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
      select: { id: true, slug: true },
    });

    categoryMap.set(saved.slug, saved.id);
  }

  const tagMap = new Map<string, string>();
  for (const tag of tags) {
    const saved = await db.tag.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        color: tag.color,
      },
      create: tag,
      select: { id: true, slug: true },
    });

    tagMap.set(saved.slug, saved.id);
  }

  for (const seed of demoPosts) {
    const contentJson = buildContentJson(seed);
    const contentHtml = buildContentHtml(seed);
    const contentText = buildContentText(seed);
    const stats = readingTime(contentText);
    const wordCount =
      contentText
        .replace(/\s+/g, "")
        .split("")
        .filter(Boolean).length || Math.max(1, Math.round(stats.words));

    const tagIds = seed.tagSlugs.map((slug) => {
      const id = tagMap.get(slug);
      if (!id) {
        throw new Error(`Missing tag mapping for ${slug}`);
      }
      return id;
    });

    const categoryId = categoryMap.get(seed.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category mapping for ${seed.categorySlug}`);
    }

    const subtopicId = subtopicMap.get(`${seed.topicSlug}/${seed.subtopicSlug}`);
    if (!subtopicId) {
      throw new Error(
        `Missing subtopic mapping for ${seed.topicSlug}/${seed.subtopicSlug}`,
      );
    }

    const createdAt = daysAgo(seed.createdDaysAgo);
    const publishedAt =
      seed.status === "published" && seed.publishedDaysAgo !== null
        ? daysAgo(seed.publishedDaysAgo)
        : null;

    await db.post.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        excerpt: seed.excerpt,
        coverImageUrl: null,
        contentJson: contentJson as Prisma.InputJsonValue,
        contentHtml,
        contentText,
        contentToc: buildToc(seed) as Prisma.InputJsonValue,
        status: seed.status,
        publishedAt,
        readingTimeMinutes: Math.max(1, Math.ceil(stats.minutes)),
        wordCount,
        seoTitle: seed.title,
        seoDescription: seed.excerpt,
        canonicalUrl: null,
        isFeatured: seed.isFeatured,
        categoryId,
        subtopicId,
        createdBy: adminUser.id,
        createdAt,
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      create: {
        title: seed.title,
        slug: seed.slug,
        excerpt: seed.excerpt,
        coverImageUrl: null,
        contentJson: contentJson as Prisma.InputJsonValue,
        contentHtml,
        contentText,
        contentToc: buildToc(seed) as Prisma.InputJsonValue,
        status: seed.status,
        publishedAt,
        readingTimeMinutes: Math.max(1, Math.ceil(stats.minutes)),
        wordCount,
        seoTitle: seed.title,
        seoDescription: seed.excerpt,
        canonicalUrl: null,
        isFeatured: seed.isFeatured,
        categoryId,
        subtopicId,
        createdBy: adminUser.id,
        createdAt,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }

  const [postCount, publishedCount, draftCount] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: "published" } }),
    db.post.count({ where: { status: "draft" } }),
  ]);

  console.log("Demo post seed complete.");
  console.log(
    JSON.stringify(
      {
        totalPosts: postCount,
        publishedPosts: publishedCount,
        draftPosts: draftCount,
        insertedDemoPosts: demoPosts.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
