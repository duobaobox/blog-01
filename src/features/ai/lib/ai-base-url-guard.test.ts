import assert from "node:assert/strict";
import test from "node:test";
import {
  canReuseStoredAiApiKey,
  isCloudMetadataHost,
  resolveAiBaseUrlOrigin,
} from "./ai-base-url-guard";

test("云元数据地址一律拒绝，各家云与其 IPv6/映射写法都覆盖", () => {
  for (const host of [
    "169.254.169.254",
    "169.254.0.1",
    "100.100.100.200",
    "metadata.google.internal",
    "metadata.goog",
    "instance-data",
    "metadata",
    "[fd00:ec2::254]",
    "[::ffff:a9fe:a9fe]",
    "[::a9fe:a9fe]",
    "[fe80::1]",
  ]) {
    assert.equal(
      isCloudMetadataHost(host),
      true,
      `${host} 应被判定为元数据地址`,
    );
  }
});

test("普通主机与私有地址不受影响", () => {
  // 自建博客可能合法地接本机或内网模型网关，这些不能被拦掉。
  for (const host of [
    "api.deepseek.com",
    "api.openai.com",
    "dashscope.aliyuncs.com",
    "localhost",
    "127.0.0.1",
    "192.168.1.10",
    "10.0.0.5",
    "100.100.100.201",
    "[::1]",
    "[fd00::1]",
  ]) {
    assert.equal(
      isCloudMetadataHost(host),
      false,
      `${host} 不应被判为元数据地址`,
    );
  }
});

test("解析源站时把端口与路径区分开", () => {
  assert.equal(
    resolveAiBaseUrlOrigin("https://api.deepseek.com/v1"),
    "https://api.deepseek.com",
  );
  assert.equal(
    resolveAiBaseUrlOrigin("https://api.deepseek.com/other"),
    "https://api.deepseek.com",
  );
  assert.equal(
    resolveAiBaseUrlOrigin("https://api.deepseek.com:8443/v1"),
    "https://api.deepseek.com:8443",
  );
  assert.equal(resolveAiBaseUrlOrigin(""), null);
  assert.equal(resolveAiBaseUrlOrigin("not a url"), null);
  assert.equal(resolveAiBaseUrlOrigin(null), null);
});

test("仅调整路径时允许复用已保存的密钥", () => {
  assert.equal(
    canReuseStoredAiApiKey({
      existingBaseUrl: "https://api.deepseek.com",
      nextBaseUrl: "https://api.deepseek.com/v1",
    }),
    true,
  );
});

test("更换主机、端口或协议都必须重新填写密钥", () => {
  assert.equal(
    canReuseStoredAiApiKey({
      existingBaseUrl: "https://api.deepseek.com/v1",
      nextBaseUrl: "https://attacker.example/v1",
    }),
    false,
  );
  assert.equal(
    canReuseStoredAiApiKey({
      existingBaseUrl: "https://api.deepseek.com/v1",
      nextBaseUrl: "https://api.deepseek.com:8443/v1",
    }),
    false,
  );
  // 协议降级会让密钥以明文发出，同样算变更。
  assert.equal(
    canReuseStoredAiApiKey({
      existingBaseUrl: "https://api.deepseek.com/v1",
      nextBaseUrl: "http://api.deepseek.com/v1",
    }),
    false,
  );
});

test("缺少任一侧地址时不复用密钥", () => {
  assert.equal(
    canReuseStoredAiApiKey({
      existingBaseUrl: null,
      nextBaseUrl: "https://a.example",
    }),
    false,
  );
  assert.equal(
    canReuseStoredAiApiKey({
      existingBaseUrl: "https://a.example",
      nextBaseUrl: null,
    }),
    false,
  );
});
