import "dotenv/config";
import readingTime from "reading-time";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import {
  expandDemoPostSeeds,
  parseDemoPostSeedScale,
} from "../src/features/posts/lib/demo-post-seed-scale";

type DemoPostSeed = {
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  folderSlug: string;
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

type DemoPostBlueprint = Omit<DemoPostSeed, "sections"> & {
  lead: string;
  focus: string;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

const folders = [
  {
    name: "产品与体验",
    slug: "product-experience",
    description: "后台工作台、内容流程和交互体验相关内容。",
    sortOrder: 1,
  },
  {
    name: "内容策略",
    slug: "content-strategy-lab",
    description: "摘要、SEO、专题组织和内容增长实验。",
    sortOrder: 2,
  },
  {
    name: "前端实现",
    slug: "frontend-implementation",
    description: "Next.js、React 和前台阅读体验优化。",
    sortOrder: 3,
  },
  {
    name: "部署与运维",
    slug: "delivery-ops",
    description: "Docker、发布检查和运行环境维护。",
    sortOrder: 4,
  },
  {
    name: "待整理灵感",
    slug: "idea-backlog",
    description: "暂存未完善想法，方便测试草稿流。",
    sortOrder: 5,
  },
] as const;

const categories = [
  {
    name: "产品设计",
    slug: "product-design",
    description: "产品体验、界面结构和交互策略。",
  },
  {
    name: "内容运营",
    slug: "content-ops",
    description: "写作组织、选题规划和内容增长。",
  },
  {
    name: "前端工程",
    slug: "frontend-engineering",
    description: "React、Next.js 与页面体验优化。",
  },
  {
    name: "部署运维",
    slug: "devops",
    description: "部署、运行和环境维护相关实践。",
  },
] as const;

const tags = [
  { name: "后台体验", slug: "admin-ux", color: "#7c3aed" },
  { name: "内容策略", slug: "content-strategy", color: "#ea580c" },
  { name: "SEO", slug: "seo", color: "#dc2626" },
  { name: "Next.js", slug: "nextjs", color: "#111827" },
  { name: "React", slug: "react", color: "#2563eb" },
  { name: "性能优化", slug: "performance", color: "#16a34a" },
  { name: "Docker", slug: "docker", color: "#0284c7" },
  { name: "发布流程", slug: "publishing-flow", color: "#0f766e" },
  { name: "测试数据", slug: "demo-data", color: "#64748b" },
  { name: "专题策划", slug: "editorial-planning", color: "#be185d" },
] as const;

const demoPosts: readonly DemoPostSeed[] = [
  {
    title: "把博客后台重做成内容工作台后，最先该验证哪三件事",
    slug: "demo-admin-workspace-first-checks",
    excerpt:
      "先验证结构定位、列表切换和编辑保存链路，能最快看出这次重构值不值。",
    categorySlug: "product-design",
    folderSlug: "product-experience",
    tagSlugs: ["admin-ux", "publishing-flow", "demo-data"],
    status: "published",
    isFeatured: true,
    publishedDaysAgo: 2,
    createdDaysAgo: 3,
    sections: [
      {
        heading: "为什么先看工作台主链路",
        paragraphs: [
          "后台最常用的动作不是配置，而是定位内容、切换文章和继续编辑。如果这三件事顺了，其他功能的体验成本都会下降。",
          "所以第一批测试数据最好覆盖多个文件夹、多篇草稿和不同状态，能直接暴露导航和筛选的问题。",
        ],
      },
      {
        heading: "建议先走的测试顺序",
        paragraphs: [
          "进入后台后，先点文件夹，再切换到草稿，最后打开一篇文章修改标题并保存，这条路径足够代表真实使用。",
        ],
        bullets: ["文件夹高亮是否明确", "列表切换是否顺手", "编辑保存是否稳定"],
      },
    ],
  },
  {
    title: "内容工作台里的文件夹，不应该只是分类，而是操作上下文",
    slug: "demo-folder-as-context",
    excerpt: "文件夹真正的价值是让用户在当前上下文里连续完成创建、筛选和编辑。",
    categorySlug: "product-design",
    folderSlug: "product-experience",
    tagSlugs: ["admin-ux", "content-strategy", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 4,
    createdDaysAgo: 5,
    sections: [
      {
        heading: "上下文比层级更重要",
        paragraphs: [
          "如果用户点进文件夹后，新建文章不能自动归属当前文件夹，整个结构就只是装饰。内容工作台的设计核心是让上下文持续生效。",
        ],
      },
      {
        heading: "这篇文章适合怎么测试",
        paragraphs: [
          "你可以进入某个文件夹后新建文章，再确认中栏是否立即出现，右侧编辑器是否直接进入这篇文章。",
        ],
      },
    ],
  },
  {
    title: "给博客首页做精选编排时，怎样让内容主题更有层次",
    slug: "demo-homepage-featured-curation",
    excerpt: "精选内容不是随便挑几篇，而是要覆盖主题、节奏和阅读入口。",
    categorySlug: "content-ops",
    folderSlug: "content-strategy-lab",
    tagSlugs: ["content-strategy", "editorial-planning", "demo-data"],
    status: "published",
    isFeatured: true,
    publishedDaysAgo: 6,
    createdDaysAgo: 7,
    sections: [
      {
        heading: "精选区承担什么角色",
        paragraphs: [
          "首页精选区决定访客第一眼会把这个博客理解成什么类型的站点，所以内容不要只集中在一个主题上。",
          "测试数据里让精选文章分布在产品、内容和工程不同方向，更容易检验前台节奏。",
        ],
      },
    ],
  },
  {
    title: "摘要和 SEO 描述应该一起设计，而不是上线前临时补",
    slug: "demo-excerpt-seo-together",
    excerpt:
      "摘要决定列表页点击意愿，SEO 描述决定搜索结果点击意愿，这两者应同时设计。",
    categorySlug: "content-ops",
    folderSlug: "content-strategy-lab",
    tagSlugs: ["seo", "content-strategy", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 8,
    createdDaysAgo: 9,
    sections: [
      {
        heading: "为什么不能临时补",
        paragraphs: [
          "如果摘要和 SEO 描述总是最后才写，通常会导致列表信息不完整、搜索片段不自然，也不利于后台批量维护。",
        ],
      },
      {
        heading: "测试重点",
        paragraphs: [
          "这篇文章适合拿来检查博客列表摘要长度、详情页 meta 信息，以及后台设置面板的回填效果。",
        ],
      },
    ],
  },
  {
    title: "分类页如果只有列表，没有主题说明，浏览体验会很弱",
    slug: "demo-category-page-structure",
    excerpt: "分类页不只是结果页，它应该帮助用户理解这个分类到底在讲什么。",
    categorySlug: "content-ops",
    folderSlug: "content-strategy-lab",
    tagSlugs: ["seo", "editorial-planning", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 10,
    createdDaysAgo: 11,
    sections: [
      {
        heading: "分类页最容易缺什么",
        paragraphs: [
          "很多分类页只有文章卡片，却没有分类说明和内容重心，导致用户点进去之后很难继续深挖。",
        ],
      },
    ],
  },
  {
    title: "Next.js 博客列表超过一页时，最容易暴露哪些交互问题",
    slug: "demo-nextjs-pagination-checks",
    excerpt: "分页问题通常要在数据足够多时才会显现，所以测试文章数量不能太少。",
    categorySlug: "frontend-engineering",
    folderSlug: "frontend-implementation",
    tagSlugs: ["nextjs", "react", "performance", "demo-data"],
    status: "published",
    isFeatured: true,
    publishedDaysAgo: 12,
    createdDaysAgo: 13,
    sections: [
      {
        heading: "分页不只是翻页",
        paragraphs: [
          "用户真正关心的是自己有没有迷路，所以当前页、上下页和返回列表后的状态都需要连续。",
        ],
      },
      {
        heading: "适合怎么测",
        paragraphs: [
          "从博客列表翻到第二页，再进入详情页后返回，能很快看出分页状态有没有保持。",
        ],
      },
    ],
  },
  {
    title: "长文章在 React 页面里，排版稳定性比花哨效果更重要",
    slug: "demo-react-long-article-layout",
    excerpt: "长内容更容易暴露标题层级、段落间距和目录生成的问题。",
    categorySlug: "frontend-engineering",
    folderSlug: "frontend-implementation",
    tagSlugs: ["react", "performance", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 14,
    createdDaysAgo: 15,
    sections: [
      {
        heading: "为什么长文更适合验版式",
        paragraphs: [
          "短文很难看出阅读节奏，长文则会把目录、段落、列表和间距问题全部放大出来。",
          "因此这类测试文章非常适合用来检查详情页的阅读体验是否稳定。",
        ],
        bullets: ["目录是否生成", "二级标题是否清晰", "移动端行宽是否舒服"],
      },
    ],
  },
  {
    title: "后台搜索如果只搜标题，不搜摘要和正文，定位效率会明显下降",
    slug: "demo-admin-search-depth",
    excerpt: "搜索体验的关键不只是框在不在，而是能否让用户真正快速定位旧内容。",
    categorySlug: "product-design",
    folderSlug: "product-experience",
    tagSlugs: ["admin-ux", "content-strategy", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 16,
    createdDaysAgo: 17,
    sections: [
      {
        heading: "搜索要解决什么问题",
        paragraphs: [
          "真实使用里，用户经常记得的是一个关键词或一句描述，而不一定记得完整标题，所以搜索范围不能太窄。",
        ],
      },
      {
        heading: "怎么验证",
        paragraphs: [
          "你可以分别搜“后台”“定位”“阅读体验”等关键词，看中栏结果是否符合预期。",
        ],
      },
    ],
  },
  {
    title: "Docker 化之后，真正容易出问题的往往是初始化和数据同步",
    slug: "demo-docker-bootstrap",
    excerpt:
      "服务启动只是开始，数据库连接、schema 同步和种子数据才是稳定运行的基础。",
    categorySlug: "devops",
    folderSlug: "delivery-ops",
    tagSlugs: ["docker", "publishing-flow", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 18,
    createdDaysAgo: 19,
    sections: [
      {
        heading: "为什么初始化更容易翻车",
        paragraphs: [
          "容器起来了，不代表数据库结构已经准备好；数据库能连，也不代表演示数据已经正确导入。这些问题在开发期尤其常见。",
        ],
      },
      {
        heading: "测试建议",
        paragraphs: [
          "这篇文章更偏运维主题，适合用来验证分类页、标签页和前台内容主题是否足够丰富。",
        ],
      },
    ],
  },
  {
    title: "发布前检查不该只看前台，还要把后台主流程走一遍",
    slug: "demo-release-checklist",
    excerpt:
      "后台能否新建、保存、删除和回到列表，决定了发版后能不能继续稳定维护。",
    categorySlug: "devops",
    folderSlug: "delivery-ops",
    tagSlugs: ["docker", "publishing-flow", "demo-data"],
    status: "published",
    isFeatured: false,
    publishedDaysAgo: 20,
    createdDaysAgo: 21,
    sections: [
      {
        heading: "检查顺序建议",
        paragraphs: [
          "最顺的顺序通常是服务状态、后台登录、内容创建、前台回归，而不是只看首页能不能打开。",
        ],
        bullets: ["服务已启动", "后台可进入", "文章可创建", "前台能回归展示"],
      },
    ],
  },
  {
    title: "草稿文章适合拿来验证什么：状态筛选、自动保存和再次打开编辑",
    slug: "demo-draft-review-flow",
    excerpt: "草稿是后台体验里最常见的状态，应该重点验证其切换和回填表现。",
    categorySlug: "content-ops",
    folderSlug: "idea-backlog",
    tagSlugs: ["admin-ux", "publishing-flow", "demo-data"],
    status: "draft",
    isFeatured: false,
    publishedDaysAgo: null,
    createdDaysAgo: 1,
    sections: [
      {
        heading: "草稿的真正用途",
        paragraphs: [
          "草稿不是未完成的发布品，而是内容工作流里最常见的中间状态，所以它的编辑和恢复体验必须稳定。",
        ],
      },
      {
        heading: "这篇草稿怎么测",
        paragraphs: [
          "打开后改标题、摘要或正文，再切换到别的文章回来，看看内容是否保持一致。",
        ],
      },
    ],
  },
  {
    title: "专题页想法池：先搭结构，再慢慢填内容",
    slug: "demo-draft-topic-idea",
    excerpt: "另一篇草稿，方便测试多草稿状态下的搜索和列表切换体验。",
    categorySlug: "product-design",
    folderSlug: "idea-backlog",
    tagSlugs: ["editorial-planning", "demo-data"],
    status: "draft",
    isFeatured: false,
    publishedDaysAgo: null,
    createdDaysAgo: 4,
    sections: [
      {
        heading: "为什么先搭骨架",
        paragraphs: [
          "很多内容不是一次写完，先有结构再补正文是更真实的写作方式，所以后台必须能很好处理半成品内容。",
        ],
      },
    ],
  },
  {
    title: "还没想清楚的内容实验记录",
    slug: "demo-draft-experiment-log",
    excerpt: "这篇更短的草稿适合拿来测试空摘要、短正文和列表展示的兼容性。",
    categorySlug: "content-ops",
    folderSlug: "idea-backlog",
    tagSlugs: ["content-strategy", "demo-data"],
    status: "draft",
    isFeatured: false,
    publishedDaysAgo: null,
    createdDaysAgo: 6,
    sections: [
      {
        heading: "实验记录的价值",
        paragraphs: [
          "短草稿也需要被很好地展示，否则后台列表容易出现信息密度不一致的问题。",
        ],
      },
    ],
  },
  ...(
    [
      {
        title:
          "后台文章列表如果只适合看十篇以内的数据，那它其实还没准备好进入真实使用",
        slug: "demo-admin-list-density",
        excerpt:
          "当文章数量上来之后，列表的信息密度、筛选效率和滚动中的定位感会立刻暴露问题。",
        categorySlug: "product-design",
        folderSlug: "product-experience",
        tagSlugs: ["admin-ux", "performance", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 22,
        createdDaysAgo: 23,
        lead: "后台列表在十篇以内通常看不出问题，但当内容逐渐变多，信息密度和选中状态是否足够清晰就会立刻成为真实阻力。",
        focus:
          "这篇文章可以帮助你观察长标题、较长摘要和多标签组合出现在中高密度列表里时的可读性。",
      },
      {
        title:
          "文章标题一旦变长，前后台的截断、悬浮提示和视觉重心都会一起接受检验",
        slug: "demo-long-title-behavior",
        excerpt:
          "长标题是最容易把列表设计、详情页层级和编辑器头部布局一起拉出来测试的内容类型。",
        categorySlug: "frontend-engineering",
        folderSlug: "frontend-implementation",
        tagSlugs: ["react", "admin-ux", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 24,
        createdDaysAgo: 25,
        lead: "短标题通常不会出问题，但只要内容进入真实写作状态，标题长度很快就会超出理想范围，于是很多细节都会暴露出来。",
        focus:
          "这类文章最适合观察后台 tooltip、前台列表卡片换行、详情页标题节奏以及移动端首屏是否仍然稳定。",
      },
      {
        title:
          "专题策划不是把文章堆到一起，而是提前决定用户会沿着什么路径继续阅读",
        slug: "demo-editorial-path-design",
        excerpt:
          "专题页真正承接的是阅读路径，所以测试数据里需要存在可以串联浏览的相关主题文章。",
        categorySlug: "content-ops",
        folderSlug: "content-strategy-lab",
        tagSlugs: ["editorial-planning", "content-strategy", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 26,
        createdDaysAgo: 27,
        lead: "很多博客会做专题，但专题页如果没有清晰的阅读顺序，就只是把标签和分类又包了一层壳，并没有真正提高内容利用率。",
        focus:
          "这篇文章适合和同文件夹的其他文章一起测试前台连续阅读的感觉，也适合检查后台按主题组织内容时是否顺手。",
      },
      {
        title:
          "当标签数量慢慢变多之后，标签页更像内容入口还是更像筛选器，其实是两种完全不同的设计决策",
        slug: "demo-tag-page-role",
        excerpt:
          "标签页的角色如果不明确，前台会显得凌乱，后台也会越来越难维护跨主题内容。",
        categorySlug: "content-ops",
        folderSlug: "content-strategy-lab",
        tagSlugs: ["seo", "editorial-planning", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 28,
        createdDaysAgo: 29,
        lead: "标签页可以是轻量筛选，也可以是跨栏目浏览入口，但两者在标题、摘要和推荐逻辑上的要求并不一样。",
        focus:
          "你可以用它测试标签页的标题、文章排序和回到博客列表后的浏览连贯性，看当前结构更偏向哪一种。",
      },
      {
        title:
          "把更多真实文章灌进数据库之后，前台分页、精选区和分类页才会真正表现出自己的性格",
        slug: "demo-data-volume-matters",
        excerpt:
          "只有当数据量足够时，分页和模块节奏的优缺点才会被放大出来，少量数据通常会掩盖结构问题。",
        categorySlug: "frontend-engineering",
        folderSlug: "frontend-implementation",
        tagSlugs: ["nextjs", "performance", "demo-data"],
        status: "published",
        isFeatured: true,
        publishedDaysAgo: 30,
        createdDaysAgo: 31,
        lead: "稀疏数据带来的最大误判，是你会误以为当前页面结构已经很整洁，但一旦文章数量增加，真正的密度问题和排序问题都会同时出现。",
        focus:
          "这篇文章的作用就是故意把列表体量抬起来，帮助你观察前台翻页和首页模块在更高数据量下是否仍然自然。",
      },
      {
        title:
          "部署流程里最需要被复盘的，往往不是命令本身，而是每一步在系统中的因果顺序",
        slug: "demo-deployment-sequence",
        excerpt:
          "发版失败很多时候不是单点错误，而是顺序错了，所以演示数据里也应该有运维主题内容去覆盖前台主题广度。",
        categorySlug: "devops",
        folderSlug: "delivery-ops",
        tagSlugs: ["docker", "publishing-flow", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 32,
        createdDaysAgo: 33,
        lead: "只记命令而不理解顺序，通常意味着出问题时只能重复试错。对博客系统来说，数据库、服务启动和内容初始化尤其依赖顺序。",
        focus:
          "这篇文章可以帮助前台保持主题多样性，也适合你在后台测试搜索“部署”“顺序”等关键词时观察命中效果。",
      },
      {
        title:
          "如果后台新建文章之后不能马上形成列表反馈，用户对系统是否成功响应会明显不安",
        slug: "demo-create-feedback-loop",
        excerpt:
          "即时反馈是内容工作台体验的关键，它比空状态文案更能决定用户是否信任系统。",
        categorySlug: "product-design",
        folderSlug: "product-experience",
        tagSlugs: ["admin-ux", "publishing-flow", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 34,
        createdDaysAgo: 35,
        lead: "用户点了新建之后，最先需要确认的是系统有没有真正接住这个动作，而不是先去理解复杂的状态提示。",
        focus:
          "这篇文章和我们刚做的即时创建逻辑是配套的，方便你继续回看后台创建后的列表反馈是否自然。",
      },
      {
        title:
          "文章摘要长短不一时，列表卡片的节奏感能不能保持稳定，决定了博客页是不是耐看",
        slug: "demo-excerpt-length-rhythm",
        excerpt:
          "真实数据里摘要长度一定会不均匀，所以列表卡片必须在信息差异中依然保持浏览节奏。",
        categorySlug: "frontend-engineering",
        folderSlug: "frontend-implementation",
        tagSlugs: ["react", "content-strategy", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 36,
        createdDaysAgo: 37,
        lead: "统一长度的假数据会让页面显得过于理想化，而真实博客最常见的情况恰恰是标题和摘要长度都不平均。",
        focus:
          "这篇文章和其他长短不一的内容一起，能帮助你直接看出列表卡片的高度节奏是否足够稳。",
      },
      {
        title:
          "从写作到上线的每一个小摩擦，最后都会累积成内容团队更新频率下降的真实原因",
        slug: "demo-friction-compounds",
        excerpt:
          "体验里的微小阻力在单次使用时不明显，但在高频写作场景里会持续侵蚀效率和意愿。",
        categorySlug: "product-design",
        folderSlug: "product-experience",
        tagSlugs: ["admin-ux", "content-strategy", "demo-data"],
        status: "published",
        isFeatured: false,
        publishedDaysAgo: 38,
        createdDaysAgo: 39,
        lead: "任何一次多余点击、模糊反馈或切换成本，看起来都不算大，但只要进入持续写作状态，这些细节就会快速累积成真实负担。",
        focus:
          "把这类文章和更多后台动作一起测试，会更容易让你判断现在的工作台体验是不是已经到了真正可用的阶段。",
      },
      {
        title:
          "下一批内容还没完全成型：这是为了测试草稿堆积时，列表过滤和搜索是否还能保持清晰",
        slug: "demo-draft-backlog-density",
        excerpt:
          "草稿数量一旦上来，后台的筛选、命名和再次定位就会比发布态更先暴露问题。",
        categorySlug: "content-ops",
        folderSlug: "idea-backlog",
        tagSlugs: ["publishing-flow", "demo-data"],
        status: "draft",
        isFeatured: false,
        publishedDaysAgo: null,
        createdDaysAgo: 2,
        lead: "草稿区最容易出现的问题不是写不写得完，而是随着半成品变多，用户越来越难确认哪些该继续、哪些该合并、哪些可以删掉。",
        focus:
          "这篇额外草稿的作用就是让你在后台切换草稿视图时，看到比之前更接近真实的密度。",
      },
      {
        title:
          "这个选题先放着：后面再决定它更适合写成工具评测、实践复盘，还是一篇完整的系统设计文章",
        slug: "demo-draft-direction-pending",
        excerpt:
          "方向未定的草稿很适合测试标签、分类和文件夹在内容还没成型时的组织方式。",
        categorySlug: "product-design",
        folderSlug: "idea-backlog",
        tagSlugs: ["editorial-planning", "demo-data"],
        status: "draft",
        isFeatured: false,
        publishedDaysAgo: null,
        createdDaysAgo: 5,
        lead: "很多真实草稿都不是从明确标题开始，而是从一个模糊方向开始，这对后台的重命名、移动和再次打开体验都是更严格的考验。",
        focus:
          "你可以把它当成一个更接近现实的半成品，看看当前工作台是否支持这种不确定状态下的内容管理。",
      },
    ] satisfies readonly DemoPostBlueprint[]
  ).map(({ lead, focus, ...post }: DemoPostBlueprint): DemoPostSeed => ({
    ...post,
    sections: [
      {
        heading: "为什么这类内容值得保留在演示数据里",
        paragraphs: [
          lead,
          "演示数据如果太整齐，很多真实问题就会被掩盖。把不同长度、不同主题和不同完成度的内容一起放进系统，反而更容易发现结构是否经得起真实使用。",
        ],
      },
      {
        heading: "这篇文章主要帮助你测什么",
        paragraphs: [
          focus,
          "除了前台浏览，你也可以顺手回到后台验证搜索、筛选、重新定位和再次编辑这条链路是否仍然顺畅。",
        ],
      },
      {
        heading: "继续优化时可以观察的信号",
        paragraphs: [
          "当数据规模和内容长度都开始变化时，页面是否仍然容易扫读、状态是否仍然清楚、交互是否仍然可预期，这些都会比视觉细节本身更早说明问题。",
        ],
        bullets: [
          "标题是否容易扫读",
          "状态是否容易辨认",
          "回到列表后是否容易继续操作",
        ],
      },
    ],
  })),
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

async function resetContentData() {
  await db.$transaction(async (tx) => {
    await tx.postTag.deleteMany();
    await tx.post.deleteMany();
    await tx.folder.deleteMany();
    await tx.category.deleteMany();
    await tx.tag.deleteMany();
  });
}

async function ensureSiteSettings() {
  await db.siteSetting.upsert({
    where: {
      scopeKey: "default",
    },
    update: {},
    create: {
      scopeKey: "default",
      siteTitle: "duobao",
      siteSubtitle: "内容工作台演示站",
      siteDescription: "用于验证后台内容工作台和前台博客体验的演示数据。",
      siteUrl: process.env.SITE_URL || "http://localhost:3000",
      email: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
      footerText: "Demo content seed",
    },
  });
}

async function main() {
  const seedScale = parseDemoPostSeedScale({
    argv: process.argv.slice(2),
    env: process.env,
  });
  const scaledDemoPosts = expandDemoPostSeeds(demoPosts, seedScale);

  console.log("Resetting and seeding demo content...");
  console.log(
    `Demo post seed scale: ${seedScale} (${scaledDemoPosts.length} posts)`,
  );

  const adminUser =
    (await db.user.findFirst({
      where: {
        username: (process.env.SEED_ADMIN_USERNAME || "admin").toLowerCase(),
      },
      select: { id: true, email: true, username: true },
    })) ||
    (await db.user.findFirst({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, username: true },
    }));

  if (!adminUser) {
    throw new Error(
      "No admin user found. Please create an admin account first.",
    );
  }

  console.log(`Using admin author: ${adminUser.username || adminUser.email}`);

  await resetContentData();
  await ensureSiteSettings();

  const folderMap = new Map<string, string>();
  for (const folder of folders) {
    const saved = await db.folder.create({
      data: folder,
      select: { id: true, slug: true },
    });

    folderMap.set(saved.slug, saved.id);
  }

  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const saved = await db.category.create({
      data: category,
      select: { id: true, slug: true },
    });

    categoryMap.set(saved.slug, saved.id);
  }

  const tagMap = new Map<string, string>();
  for (const tag of tags) {
    const saved = await db.tag.create({
      data: tag,
      select: { id: true, slug: true },
    });

    tagMap.set(saved.slug, saved.id);
  }

  for (const seed of scaledDemoPosts) {
    const contentJson = buildContentJson(seed);
    const contentHtml = buildContentHtml(seed);
    const contentText = buildContentText(seed);
    const stats = readingTime(contentText);
    const wordCount =
      contentText.replace(/\s+/g, "").split("").filter(Boolean).length ||
      Math.max(1, Math.round(stats.words));

    const categoryId = categoryMap.get(seed.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category mapping for ${seed.categorySlug}`);
    }

    const folderId = folderMap.get(seed.folderSlug);
    if (!folderId) {
      throw new Error(`Missing folder mapping for ${seed.folderSlug}`);
    }

    const tagIds = seed.tagSlugs.map((slug) => {
      const id = tagMap.get(slug);
      if (!id) {
        throw new Error(`Missing tag mapping for ${slug}`);
      }

      return id;
    });

    const createdAt = daysAgo(seed.createdDaysAgo);
    const publishedAt =
      seed.status === "published" && seed.publishedDaysAgo !== null
        ? daysAgo(seed.publishedDaysAgo)
        : null;

    await db.post.create({
      data: {
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
        createdAt,
        updatedAt: createdAt,
        categoryId,
        folderId,
        createdBy: adminUser.id,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }

  console.log(
    `Demo content seeded: ${folders.length} folders, ${categories.length} categories, ${tags.length} tags, ${scaledDemoPosts.length} posts.`,
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
