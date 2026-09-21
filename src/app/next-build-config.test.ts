import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function readWorkspaceFile(path: string) {
  return readFile(join(process.cwd(), path), "utf8");
}

test("next config pins the turbopack workspace root", async () => {
  const config = await readWorkspaceFile("next.config.ts");

  // 仓库路径可能包含非 ASCII 字符。若缺少显式 root，Next 会从上层目录推断工作区根
  // （例如 home 目录下的游离 lockfile），把中文写进 Turbopack 的内部标识符，
  // 触发 Turbopack 按字节切分文件名并 panic，构建直接失败。
  assert.match(
    config,
    /turbopack:\s*\{[\s\S]*?\broot:/,
    "next.config.ts 必须显式声明 turbopack.root，否则含非 ASCII 字符的仓库路径会导致构建崩溃",
  );
});

test("next config keeps the clickjacking and sniffing protections", async () => {
  const config = await readWorkspaceFile("next.config.ts");

  for (const header of [
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
  ]) {
    assert.ok(
      config.includes(`key: "${header}"`),
      `next.config.ts 缺少安全响应头 ${header}`,
    );
  }

  assert.match(
    config,
    /frame-ancestors 'none'/,
    "CSP 必须包含 frame-ancestors 'none'，否则后台页面可被任意站点嵌套",
  );
});

test("HSTS 只在请求经代理以 HTTPS 到达时下发", async () => {
  const config = await readWorkspaceFile("next.config.ts");
  const hstsBlock = config.slice(
    config.indexOf("Strict-Transport-Security") - 600,
    config.indexOf("Strict-Transport-Security"),
  );

  // 无条件 HSTS 会让纯 HTTP 部署被浏览器强制跳转 HTTPS，直接不可访问。
  assert.match(
    hstsBlock,
    /x-forwarded-proto/,
    "HSTS 必须挂在 x-forwarded-proto: https 条件上",
  );
});
