export const DEFAULT_TRUSTED_PROXIES = ["127.0.0.1", "::1"];

/**
 * 解析 `BETTER_AUTH_TRUSTED_PROXIES`（逗号分隔，支持 CIDR）。
 *
 * 只有反向代理不在本机时才需要配置；默认值覆盖文档中描述的部署形态：
 * Nginx 与容器同机，代理到 127.0.0.1:3000。
 */
export function resolveTrustedProxies(raw?: string | null) {
  const trimmed = raw?.trim();

  if (!trimmed) {
    return [...DEFAULT_TRUSTED_PROXIES];
  }

  const entries = trimmed
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries.length > 0 ? entries : [...DEFAULT_TRUSTED_PROXIES];
}
