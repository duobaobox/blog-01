# Posts 查询计划基线

这份文档只记录当前仍在使用的 posts 关键读路径，避免性能文档继续描述已经删除的 library / recent feed。

## 检查命令

```bash
npm run db:explain:posts
npm run db:explain:posts:analyze
```

当前脚本覆盖：

- 后台当前文件夹笔记列表：按 `folderId + status + createdAt` 读取
- 前台 Blog 列表：按发布状态、精选和发布时间读取
- 后台概览统计：草稿、待发布、已发布和已归档数量

## 判断原则

个人博客的数据规模通常很小，顺序扫描本身不等于问题。检查时优先关注：

1. 数据量增长后，文件夹列表是否稳定命中 `status + folderId` 相关索引。
2. 前台列表的 `isFeatured + publishedAt + createdAt` 排序是否出现明显成本。
3. 概览状态统计是否保持单次轻量聚合。

需要更接近真实规模的样本时：

```bash
npm run db:seed:demo-posts -- --scale=5
npm run db:explain:posts:analyze
```

不要为了小样本中的 Seq Scan 盲目增加索引；只有真实执行时间、buffer 或增长趋势出现证据时再调整。
