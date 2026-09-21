import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

/**
 * 客户端组件不得引入服务端模块。
 *
 * `src/infrastructure/db` 在模块作用域读取 `DATABASE_URL`，仓储层直接依赖 Prisma；
 * 一旦被客户端组件引用，这些内容会被打进浏览器包。`src/infrastructure/auth/client`
 * 是 Better Auth 的浏览器端 SDK，属于例外。
 */
const FORBIDDEN_CLIENT_IMPORTS = [
  { prefix: "@/infrastructure/db", reason: "数据库客户端" },
  { prefix: "@/infrastructure/auth", reason: "服务端会话能力" },
  { prefix: "@/infrastructure/cache", reason: "服务端缓存失效能力" },
  {
    prefix: "@/features/editor/content-materializer",
    reason: "服务端正文物化（含 pinyin-pro 等重依赖）",
  },
];

const CLIENT_SAFE_EXCEPTIONS = ["@/infrastructure/auth/client"];

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

function listImports(source: string) {
  return [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
}

test("客户端组件不引入服务端模块", async () => {
  const files = await listSourceFiles("src");
  const violations: string[] = [];

  for (const file of files) {
    if (file.includes(".test.")) {
      continue;
    }

    const source = await readFile(join(process.cwd(), file), "utf8");

    if (!source.startsWith('"use client"')) {
      continue;
    }

    for (const importPath of listImports(source)) {
      if (CLIENT_SAFE_EXCEPTIONS.includes(importPath)) {
        continue;
      }

      if (importPath.includes("/repositories/")) {
        violations.push(`${file} -> ${importPath}（仓储层直连 Prisma）`);
        continue;
      }

      const forbidden = FORBIDDEN_CLIENT_IMPORTS.find((entry) =>
        importPath.startsWith(entry.prefix),
      );

      if (forbidden) {
        violations.push(`${file} -> ${importPath}（${forbidden.reason}）`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `以下客户端组件引入了服务端模块：\n${violations.join("\n")}`,
  );
});
