import type { NextConfig } from "next";
import { ALLOWED_IMAGE_REMOTE_PATTERNS } from "./src/shared/config/image-hosts";

/**
 * 安全响应头。
 *
 * CSP 只包含不依赖 nonce、不会误伤 Next.js 内联脚本的指令：frame-ancestors
 * 防点击劫持（后台登录与设置表单最需要），object-src / base-uri 属于零成本加固。
 * 完整的 script-src 策略需要配置 nonce 与中间件，超出当前交付范围。
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // 必须显式指定工作区根目录：仓库路径可能包含非 ASCII 字符，若向上层目录误推断出
  // 工作区根，Turbopack 会按字节切分含中文的内部标识符并直接 panic，导致构建失败。
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // 与写入校验共用同一份白名单，避免校验放过的主机在渲染时抛错。
    remotePatterns: [...ALLOWED_IMAGE_REMOTE_PATTERNS],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // 只有经反向代理以 HTTPS 到达时才下发 HSTS。生产环境允许纯 HTTP 部署
        // （validate-production-env 对此仅告警），无条件下发会把这类部署锁死在
        // 浏览器强跳 HTTPS 的状态里。
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "https" }],
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
