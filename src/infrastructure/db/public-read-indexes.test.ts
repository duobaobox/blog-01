import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

/**
 * 公开列表的排序键与封面图回查条件都必须有索引支撑，否则数据量上来后
 * 每次请求都会退化成全表排序/扫描。这类退化不会让测试变红，只能在
 * schema 层显式守住。
 */
async function readSchema() {
  return readFile(join(process.cwd(), "prisma/schema.prisma"), "utf8");
}

function readModelBlock(schema: string, model: string) {
  const match = schema.match(
    new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`),
  );

  assert.ok(match, `schema.prisma 中找不到 model ${model}`);
  return match[0];
}

function readIndexes(modelBlock: string) {
  return [...modelBlock.matchAll(/@@index\(\[([^\]]+)\]\)/g)].map((match) =>
    match[1]
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean),
  );
}

test("post 的公开排序键被索引覆盖", async () => {
  const postBlock = readModelBlock(await readSchema(), "post");
  const indexes = readIndexes(postBlock);

  // getPostOrderBy("published") 的排序键：isFeatured DESC, publishedAt DESC, createdAt DESC。
  // 索引列顺序与排序键一致时 Postgres 才能直接用索引满足排序。
  assert.ok(
    indexes.some(
      (index) =>
        index[0] === "status" &&
        index[1] === "isFeatured" &&
        index[2] === "publishedAt" &&
        index[3] === "createdAt",
    ),
    "post 需要 [status, isFeatured, publishedAt, createdAt] 索引来支撑公开列表排序",
  );
});

test("media.url 被索引覆盖", async () => {
  const mediaBlock = readModelBlock(await readSchema(), "media");
  const indexes = readIndexes(mediaBlock);

  assert.ok(
    indexes.some((index) => index[0] === "url"),
    "media 需要 url 索引来支撑封面图按 url 批量回查",
  );
});

test("公开读路径的索引变更已进入迁移文件", async () => {
  const migration = await readFile(
    join(
      process.cwd(),
      "prisma/migrations/20260917120000_add_public_read_indexes/migration.sql",
    ),
    "utf8",
  );

  assert.match(
    migration,
    /CREATE INDEX "post_status_isFeatured_publishedAt_createdAt_idx"/,
  );
  assert.match(migration, /CREATE INDEX "media_url_idx"/);
});
