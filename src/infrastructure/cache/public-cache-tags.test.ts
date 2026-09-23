import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { PUBLIC_CACHE_TAGS } from "./public-cache";

const CACHE_MODULE_DIR = "src/infrastructure/cache";

async function listSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(join(process.cwd(), root), {
    withFileTypes: true,
  });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = `${root}/${entry.name}`;

      if (entry.isDirectory()) {
        return listSourceFiles(path);
      }

      return entry.isFile() && /\.tsx?$/.test(entry.name) ? [path] : [];
    }),
  );

  return files.flat();
}

/**
 * 公开缓存标签必须真的有查询在消费。
 *
 * 之前 `posts` / `taxonomy` 两个标签只在失效计划里被 `revalidateTag` 调用，
 * 没有任何 `unstable_cache` 条目挂着它们——那些失效调用其实是空操作，
 * 而代码看起来一切正常。这种“假装在失效”只能靠不变量测试挡住。
 */
test("每个公开缓存标签都有查询在消费", async () => {
  const files = await listSourceFiles("src");
  const consumersByTag = new Map<string, string[]>(
    Object.values(PUBLIC_CACHE_TAGS).map((tag) => [tag, []]),
  );

  for (const file of files) {
    if (file.includes(".test.") || file.startsWith(CACHE_MODULE_DIR)) {
      continue;
    }

    const source = await readFile(join(process.cwd(), file), "utf8");

    if (!source.includes("unstable_cache(")) {
      continue;
    }

    for (const [key, tag] of Object.entries(PUBLIC_CACHE_TAGS)) {
      // 只有出现在缓存条目的 tags 选项里才算真正被消费。
      if (
        source.includes(`PUBLIC_CACHE_TAGS.${key}`) &&
        source.includes("tags:")
      ) {
        consumersByTag.get(tag)?.push(file);
      }
    }
  }

  for (const [tag, consumers] of consumersByTag) {
    assert.ok(
      consumers.length > 0,
      `缓存标签 ${tag} 没有任何 unstable_cache 条目消费，公开内容的 revalidateTag 是空操作`,
    );
  }
});
