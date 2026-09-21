import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 必须显式指定工作区根目录：仓库路径可能包含非 ASCII 字符，若向上层目录误推断出
  // 工作区根，Turbopack 会按字节切分含中文的内部标识符并直接 panic，导致构建失败。
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
