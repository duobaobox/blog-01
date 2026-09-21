-- contentText 的有界前缀，供公开列表卡片和 RSS 摘要使用。
--
-- 公开列表此前为了渲染 120 字预览会拉取整篇 contentText（@db.Text，平均数 KB），
-- RSS 更是为 200 字描述拉满 20 篇正文。新增 previewText 后列表与 feed 只读这一列。
-- 该列由服务端物化，与 contentHtml / contentText / contentToc 同步更新；
-- 作者手工填写的 excerpt 仍然是首选摘要，previewText 只作为兜底。
ALTER TABLE "post" ADD COLUMN "previewText" TEXT;
