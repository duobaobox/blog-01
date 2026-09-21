-- 公开读路径的两个缺失索引。
--
-- 1. post：公开列表按 isFeatured DESC, publishedAt DESC, createdAt DESC 排序，
--    原有的 [status, publishedAt, createdAt] 不含 isFeatured，Postgres 无法用索引
--    满足排序，每次请求都要重排全部已发布行。
-- 2. media：封面图按 url IN (...) 批量回查媒体元数据，url 上没有索引会走全表扫描。
CREATE INDEX "post_status_isFeatured_publishedAt_createdAt_idx" ON "post"("status", "isFeatured", "publishedAt", "createdAt");

CREATE INDEX "media_url_idx" ON "media"("url");
