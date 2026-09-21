import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_IMAGE_REMOTE_PATTERNS,
  isRenderableImageUrl,
  matchesAllowedImageHostname,
} from "./image-hosts";

test("站内 /media 路径可渲染", () => {
  assert.equal(isRenderableImageUrl("/media/2026/cover.png"), true);
  assert.equal(isRenderableImageUrl("/media/cover.png"), true);
});

test("协议相对地址与反斜杠路径被拒绝", () => {
  assert.equal(isRenderableImageUrl("//cdn.example.com/cover.png"), false);
  assert.equal(isRenderableImageUrl("media/cover.png"), false);
  assert.equal(isRenderableImageUrl("/media\\cover.png"), false);
});

test("只有白名单主机可渲染", () => {
  const [pattern] = ALLOWED_IMAGE_REMOTE_PATTERNS;
  const allowed = `https://store.${pattern.hostname.replace("**.", "")}/cover.png`;

  assert.equal(isRenderableImageUrl(allowed), true);
  // 裸域（不带子域）也应匹配 `**.` 前缀写法。
  assert.equal(
    isRenderableImageUrl(`https://${pattern.hostname.replace("**.", "")}/cover.png`),
    true,
  );
  assert.equal(isRenderableImageUrl("https://cdn.example.com/cover.png"), false);
});

test("协议不一致的地址被拒绝", () => {
  const [pattern] = ALLOWED_IMAGE_REMOTE_PATTERNS;
  const host = pattern.hostname.replace("**.", "");

  // 白名单只声明了 https，http 会让图片优化器拒绝。
  assert.equal(isRenderableImageUrl(`http://store.${host}/cover.png`), false);
  assert.equal(isRenderableImageUrl(`ftp://store.${host}/cover.png`), false);
});

test("空值与无法解析的值被拒绝", () => {
  assert.equal(isRenderableImageUrl(""), false);
  assert.equal(isRenderableImageUrl("   "), false);
  assert.equal(isRenderableImageUrl("not a url"), false);
});

test("主机匹配支持前缀通配并忽略大小写", () => {
  assert.equal(matchesAllowedImageHostname("a.b.example.com", "**.example.com"), true);
  assert.equal(matchesAllowedImageHostname("example.com", "**.example.com"), true);
  assert.equal(matchesAllowedImageHostname("notexample.com", "**.example.com"), false);
  assert.equal(matchesAllowedImageHostname("A.B.EXAMPLE.COM", "**.example.com"), true);
  assert.equal(matchesAllowedImageHostname("cdn.example.com", "cdn.example.com"), true);
  assert.equal(matchesAllowedImageHostname("other.example.com", "cdn.example.com"), false);
});
