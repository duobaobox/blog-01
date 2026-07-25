import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ConfigurationError } from "@/shared/lib/app-error";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function getEncryptionKey() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new ConfigurationError(
      "缺少 BETTER_AUTH_SECRET，无法安全保存 AI API Key。",
    );
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptAiApiKey(value: string) {
  const apiKey = value.trim();
  if (!apiKey) return null;

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptAiApiKey(value: string | null | undefined) {
  if (!value) return "";

  const [version, ivValue, authTagValue, encryptedValue] = value.split(".");
  if (
    version !== VERSION ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    throw new ConfigurationError("已保存的 AI API Key 格式无效，请重新配置。");
  }

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new ConfigurationError(
      "无法解密已保存的 AI API Key，请检查服务端密钥配置。",
    );
  }
}
