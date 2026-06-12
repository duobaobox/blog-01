# 演示文章测试数据

用于给当前数据库补充一批可重复执行的演示分类、标签和文章，方便联调这些页面和流程：

- `/blog`
- `/blog/categories/[slug]`
- `/blog/tags/[slug]`
- `/admin/posts`

推荐直接使用项目脚本：

```bash
npm run db:seed:demo-posts
```

如果只想单独执行文件，也可以：

```bash
npx tsx prisma/seed-demo-posts.ts
```

脚本行为：

- `upsert` 演示分类和标签
- `upsert` 一批已发布 / 草稿混合的测试文章
- 适合回归分页、搜索、状态筛选和分类 / 标签浏览
