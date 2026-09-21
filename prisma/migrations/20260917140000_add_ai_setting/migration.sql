-- 独立的 AI 设置表。
--
-- 该表在「拆分独立 AI 设置数据模型」时只加进了 schema.prisma，没有配套 migration，
-- 于是通过 `migrate deploy` 初始化的环境会缺这张表（`db:diff` 能看出漂移，但
-- `db:check:migration-coverage` 只核对迁移是否已应用，`db:preflight:release` 也不会报错）。
--
-- 使用 IF NOT EXISTS 是为了兼容两类环境：
--   * 全新环境：由本迁移创建表与唯一索引；
--   * 历史 `db push` 环境：表已存在，本迁移退化为无操作，但缺失的唯一索引会被补上。
-- 这样两种路径执行后都与 schema.prisma 一致，不会因为“表已存在”而中断发布。
CREATE TABLE IF NOT EXISTS "aiSetting" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL DEFAULT 'default',
    "aiConfigured" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" TEXT NOT NULL DEFAULT 'openai-compatible',
    "aiBaseUrl" TEXT,
    "aiModel" TEXT,
    "aiApiKeyEncrypted" TEXT,
    "aiProtocol" TEXT NOT NULL DEFAULT 'chat-completions',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aiSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "aiSetting_scopeKey_key" ON "aiSetting"("scopeKey");
