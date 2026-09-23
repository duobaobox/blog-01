import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TRUSTED_PROXIES,
  resolveTrustedProxies,
} from "./trusted-proxies";

test("未配置时回落本机代理默认值", () => {
  assert.deepEqual(resolveTrustedProxies(undefined), [
    ...DEFAULT_TRUSTED_PROXIES,
  ]);
  assert.deepEqual(resolveTrustedProxies(null), [...DEFAULT_TRUSTED_PROXIES]);
  assert.deepEqual(resolveTrustedProxies(""), [...DEFAULT_TRUSTED_PROXIES]);
  assert.deepEqual(resolveTrustedProxies("   "), [...DEFAULT_TRUSTED_PROXIES]);
});

test("逗号分隔的代理列表会被去空白", () => {
  assert.deepEqual(resolveTrustedProxies(" 10.0.0.1 , 172.17.0.1/16 ,::1 "), [
    "10.0.0.1",
    "172.17.0.1/16",
    "::1",
  ]);
});

test("只剩分隔符的配置回落到默认值而不是空列表", () => {
  // 空的可信代理列表会让 better-auth 退回“只信任单值 X-Forwarded-For”，
  // 等于悄悄把伪造漏洞放回来。
  assert.deepEqual(resolveTrustedProxies(",,  ,"), [
    ...DEFAULT_TRUSTED_PROXIES,
  ]);
});

test("默认值不会被调用方就地修改", () => {
  const first = resolveTrustedProxies(undefined);
  first.push("203.0.113.1");

  assert.deepEqual(resolveTrustedProxies(undefined), [
    ...DEFAULT_TRUSTED_PROXIES,
  ]);
});

test("限流配置优先使用代理覆写的 x-real-ip，并挂上可信代理链", async () => {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const source = await readFile(
    join(process.cwd(), "src/infrastructure/auth/index.ts"),
    "utf8",
  );

  // 没有可信代理链时 better-auth 只接受单值 X-Forwarded-For（可伪造），
  // 多值真实代理链反而解析失败并让所有访客共用一个限流桶。
  assert.match(source, /trustedProxies:/, "auth 配置必须声明 trustedProxies");

  const headersMatch = source.match(/ipAddressHeaders:\s*\[([^\]]+)\]/);
  assert.ok(headersMatch, "auth 配置必须声明 ipAddressHeaders");
  const headers = headersMatch[1]
    .split(",")
    .map((entry) => entry.trim().replace(/^["']|["']$/g, ""));
  assert.equal(
    headers[0],
    "x-real-ip",
    "x-real-ip 由反向代理覆写，必须排在 x-forwarded-for 之前",
  );
  assert.ok(headers.includes("x-forwarded-for"));
});
