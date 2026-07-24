-- 产品层只保留“内部 / 已发布”两种状态。
-- 历史待发布、归档及其他非公开状态统一回到内部。
UPDATE "post"
SET
  "status" = 'draft',
  "publishedAt" = NULL
WHERE "status" <> 'published';
