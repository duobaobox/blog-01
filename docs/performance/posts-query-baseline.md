# Posts 查询计划基线

这份文档记录当前仓库对 `posts` 关键读路径的 `EXPLAIN` 基线，目的是让后续索引调整和查询收口有可对照的证据，而不是只凭直觉优化。

## 适用命令

```bash
npm run db:explain:posts
```

如需进一步查看真实执行时间和 buffer 命中，可执行：

```bash
npm run db:explain:posts:analyze
```

当前脚本覆盖：

- Admin library feed
- Admin recent feed
- Public blog feed
- Admin metrics snapshot

## 最近一次检查

检查时间：2026-06-15

说明：本次检查是在当前本地数据库上直接执行，而且已经完成：

```bash
npm run db:push
npm run db:diff
```

当前数据库与 `schema.prisma` 已同步，`db:diff` 返回 `No difference detected.`。

因此下面结果反映的是：

- 索引已经进入数据库
- 但当前本地样本数据量仍然偏小，PostgreSQL planner 认为顺序扫描成本更低，所以仍然可能不主动选用复合索引

## 当前样本规模

在最近一次 explain 前，已执行：

```bash
npm run db:seed:demo-posts
```

当前本地样本量：

- `post`: 24
- `folder`: 5
- `category`: 4
- `tag`: 10

这比最初的极小样本更接近真实使用，但对 PostgreSQL 来说仍然属于小规模数据集。

如需做更接近中期运营规模的性能回归，可以放大同一批 demo blueprint：

```bash
npm run db:seed:demo-posts -- --scale=5
npm run db:explain:posts
npm run db:explain:posts:analyze
```

`--scale=5` 会生成约 120 篇文章，并保持 slug 唯一、发布时间分布递增。也可以通过 `DEMO_POST_SEED_SCALE=5 npm run db:seed:demo-posts` 使用同一机制。当前脚本允许的 scale 范围是 `1..20`，避免误把本地性能回归变成超大批量写入。

## EXPLAIN ANALYZE 观察

在当前 24 篇文章样本下执行：

```bash
npm run db:explain:posts:analyze
```

得到的关键补充信号：

- Admin library feed：真实执行时间约 `4.534 ms`
- Admin recent feed：真实执行时间约 `0.245 ms`
- Public blog feed：真实执行时间约 `0.536 ms`
- Admin metrics snapshot：真实执行时间约 `3.028 ms`

这说明在当前样本量下，即使主要走顺序扫描，真实执行时间仍然很低，暂时不构成性能瓶颈。

但同时也暴露出一个更值得继续观察的点：

- plain `EXPLAIN` 下，`postTag` 子查询曾显示 `Index Only Scan`
- `EXPLAIN ANALYZE` 下，`Admin metrics snapshot` 的 `postTag` 子查询表现为按每篇文章重复执行的 `Seq Scan`

这意味着：

- 当前小样本下 planner/执行器对 `postTag` 的策略仍然可能波动
- 一旦文章和标签关联规模继续上升，`getAdminPostMetricsSnapshot()` 会比普通列表页更值得优先治理

## Metrics Snapshot 查询改写后的观察

在最近一次优化中，`getAdminPostMetricsSnapshot()` 已经从“按 post 做 `NOT EXISTS` 相关子查询”改成：

- 先对 `postTag` 按 `postId` 聚合
- 再和 `post` 做 `LEFT JOIN`
- 用 `COALESCE(tagCount, 0) = 0` 统计 `untagged`

改写后重新执行 `npm run db:explain:posts:analyze`，可以看到：

- 原先按每篇文章重复执行的 `postTag` 子查询不见了
- 计划变成一次 `HashAggregate` + 一次 `Hash Right Join`

这类计划在当前 24 篇文章样本下，真实执行时间大约 `6.124 ms`，比之前小样本下的 `3.028 ms` 更高，但它的意义主要不是“当前更快”，而是：

- 避免查询形态随着文章数线性放大成“按 post 重复扫 postTag”
- 让 `untagged` 统计在更大数据量下更容易保持稳定
- 给后续继续拆 `getAdminPostMetricsSnapshot()` 打下更清晰的基础

因此当前判断是：

- 小样本下，这次改写更偏“稳定性优化”而不是“立刻降耗优化”
- 中大样本下，这种形态通常比相关子查询更可控，值得保留

### 1. Admin library feed

结果摘要：

- 当前走 `Seq Scan on post`
- 再做 `updatedAt DESC, createdAt DESC` 排序

当前信号：

- 当前不是“索引不存在”，而是 planner 认为在极小数据集上顺序扫描更便宜
- 这类结果不能直接推导出索引设计无效，需要在更接近真实规模的数据上继续观察

### 2. Admin recent feed

结果摘要：

- 当前走 `Seq Scan on post`
- 再做 `updatedAt DESC, createdAt DESC` 排序

当前信号：

- `status IN ('draft', 'review', 'published')` 这条高频后台路径在当前小样本下依然没有拿到索引收益
- 但现在已经可以确认：这是 planner 选择问题，不再是 schema 未同步问题

### 3. Public blog feed

结果摘要：

- 当前走 `Seq Scan on post`
- 再做 `isFeatured DESC, publishedAt DESC, createdAt DESC` 排序

当前信号：

- 当前数据规模下，public published feed 也没有体现出复合索引收益
- 后续需要在更多已发布文章样本下再次 explain；如果首页/博客列表数据量明显上升，还要继续评估 `isFeatured` 排序成本

### 4. Admin metrics snapshot

结果摘要：

- 主查询当前走 `Seq Scan on post`
- `untagged` 子查询能命中 `postTag_pkey` 做 `Index Only Scan`

当前信号：

- 当前数据量小的时候问题不大，但随着文章数增长，这条聚合快照会成为后台首页和内容治理计数的长期热点
- 如果后续 explain 仍然显示全表扫描，可继续拆分聚合策略，或者考虑更明确的派生统计方案
- `EXPLAIN ANALYZE` 还提示 `postTag` 相关子查询在真实执行时可能退化为重复顺序扫描，因此这一块的风险优先级高于普通 feed 排序
- 目前已通过查询改写消除了按 post 重复扫 `postTag` 的形态，后续应继续观察更大样本下的真实收益

## 当前结论

1. explain 脚本已经能稳定跑出关键路径计划，后续性能优化可以进入“有证据迭代”。
2. 当前数据库已经与 schema 同步；在 24 篇文章的样本量下，planner 仍然主要选择顺序扫描，这说明接下来需要更大样本或真实执行时间数据来判断索引收益。
3. `EXPLAIN ANALYZE` 证明当前小样本下真实执行时间仍然很低，但也把 `getAdminPostMetricsSnapshot()` 暴露成了下一阶段最值得盯的热点。
4. 下一步应优先执行：

```bash
npm run db:explain:posts
npm run db:explain:posts:analyze
```

目标不是立刻追求零顺序扫描，而是确认：

- 在更高数据量下，planner 是否开始命中我们为后台 recent / public published 路径设计的索引
- `getAdminPostMetricsSnapshot()` 是否需要继续拆分
- metrics snapshot 改写后，在更高数据量下是否比旧的相关子查询形态更稳定

## Admin posts 工作台缓存证据

当前 `content-space` 工作台进入 `getAdminPostsPageData()` 后，会同时读取：

- content tree
- library / recent feed
- draft posts
- ready-to-publish posts
- quick entry counts
- categories / tags
- saved views
- 按 query plan 决定是否加载 search context、folder context、selected post

其中 posts feed 的缓存边界现在固定为：

| 路径 | 缓存条件 | 不走缓存的情况 | 证据 |
| --- | --- | --- | --- |
| Admin recent feed | `page === 1` | 第 2 页及以后 | `shouldUseAdminRecentPostsPageCache()` |
| Admin library feed | `page === 1` 且没有 filters | 搜索、状态筛选、治理债筛选、分页 | `shouldUseAdminLibraryPostsPageCache()` |

这意味着：

- 工作台默认首屏可以复用 admin cache tag
- 搜索和治理筛选不会误用无过滤缓存
- 后续 explain 对照仍以 `Admin library feed`、`Admin recent feed`、`Admin metrics snapshot` 三条为主

针对性测试：

```bash
npm test -- src/features/posts/queries/post.queries.test.ts
```

更进一步的下一步建议：

1. 用 `npm run db:seed:demo-posts -- --scale=5` 把 demo 数据规模扩大到更接近真实运营量，再重跑 explain。
2. 对同一批查询执行 `npm run db:explain:posts:analyze`，观察真实执行时间和 buffer 行为，而不只看 planner 估算。
3. 如果更大样本下 metrics snapshot 仍稳定全表扫描，优先考虑拆分 `getAdminPostMetricsSnapshot()`。
