# Posts 查询计划基线

这份文档只记录当前仍在使用的 posts 关键读路径，避免性能文档继续描述已经删除的 library / recent feed。

## 检查命令

```bash
npm run db:explain:posts
npm run db:explain:posts:analyze
```

当前脚本覆盖：

- 后台当前文件夹笔记列表：按 `folderId + createdAt` 读取
- 前台 Blog 列表：按发布状态、精选和发布时间读取
- 后台概览统计：内部和已发布数量

## 前台列表排序索引（2026-09 实测记录）

前台列表的排序键是 `isFeatured DESC, publishedAt DESC, createdAt DESC`，
而原有索引里没有任何一个包含 `isFeatured`，因此排序无法由索引满足。
在 3000 篇已发布文章的样本上（`npm run db:seed:demo-posts -- --scale=5` 补齐规模后手工灌入）实测：

| 方案 | 计划 | Buffers | 执行时间 |
| --- | --- | --- | --- |
| 无 `[status, isFeatured, publishedAt, createdAt]` 索引 | Seq Scan + top-N heapsort | 76 | 1.173 ms |
| 有该索引 | Index Scan Backward | 13 | 0.045 ms |

差距随已发布文章数线性扩大（无索引时必须扫描并排序全部匹配行），因此该索引由
migration `20260917120000_add_public_read_indexes` 引入。同一 migration 还给
`media.url` 加了索引：封面图按 `url IN (...)` 批量回查，缺索引时是全表扫描。

当前 `db:explain:posts:analyze` 在前台列表一节的输出应包含：

```
Index Scan Backward using "post_status_isFeatured_publishedAt_createdAt_idx" on post p
  Index Cond: (status = 'published'::text)
```

## 列表与 feed 不再读取整篇正文

列表卡片只需要一两行预览，RSS 只需要 200 字描述，此前却会拉取整篇
`contentText`（`@db.Text`，平均数 KB）。现在由服务端物化 `previewText`
（`contentText` 的前 200 字），列表与 feed 只读这一列。

- 卡片摘要：作者填了 `excerpt` 就用它，否则回退 `previewText` 前 120 字
- RSS 描述：`excerpt ?? previewText`，与旧的 `contentText.slice(0, 200)` 等价
- 历史数据需要运行一次 `npm run db:backfill:post-content -- --apply` 补齐该列

## 判断原则

个人博客的数据规模通常很小，顺序扫描本身不等于问题。检查时优先关注：

1. 数据量增长后，文件夹列表是否稳定命中 `folderId` 相关索引。
2. 前台列表是否稳定命中 `post_status_isFeatured_publishedAt_createdAt_idx`，而不是退回 Seq Scan + Sort。
3. 概览状态统计是否保持单次轻量聚合。

需要更接近真实规模的样本时：

```bash
npm run db:seed:demo-posts -- --scale=5
npm run db:explain:posts:analyze
```

依然不要为了小样本中的 Seq Scan 盲目增加索引；上面那条索引是因为拿到了真实执行时间与 buffer 证据才加的。
