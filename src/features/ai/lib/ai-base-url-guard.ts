/**
 * AI Base URL 的两个防护点。
 *
 * 这里的取舍：自建博客可能合法地接内网或本机的模型网关（Ollama、vLLM、
 * 公司内网网关），所以**不**封禁私有地址段——那会造成功能回退。真正需要挡住的是：
 *
 * 1. 云元数据地址。它们永远不可能是合法的模型端点，却能让服务器把请求打到实例
 *    元数据服务上，零误伤。
 * 2. 复用已保存密钥时的地址变更。攻击者拿到后台会话后，只要把 Base URL 改成自己的
 *    地址，服务端就会带着解密后的密钥去请求——这条路径必须切断：换了源站就得重新
 *    填写密钥。
 */

const METADATA_HOSTNAMES = new Set([
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

// 阿里云元数据地址；100.64.0.0/10 是运营商级 NAT 段，正常模型端点不会落在这里。
const ALIBABA_METADATA_HOST = "100.100.100.200";

function isCloudMetadataIpv4(hostname: string) {
  if (hostname === ALIBABA_METADATA_HOST) {
    return true;
  }

  const octets = hostname.split(".");

  if (octets.length !== 4) {
    return false;
  }

  const first = Number(octets[0]);
  const second = Number(octets[1]);

  // 169.254.0.0/16：链路本地，也是 AWS/GCP/Azure 的元数据地址段。
  return first === 169 && second === 254;
}

function isCloudMetadataIpv6(hostname: string) {
  if (!hostname.startsWith("[") || !hostname.endsWith("]")) {
    return false;
  }

  // URL 归一化后 IPv6 主机名仍带方括号，且 IPv4-mapped 会写成十六进制分组。
  const inner = hostname.slice(1, -1).toLowerCase();

  return (
    inner.startsWith("fe80:") || // 链路本地
    inner === "fd00:ec2::254" || // AWS IPv6 元数据
    inner === "::ffff:a9fe:a9fe" || // IPv4-mapped 169.254.169.254
    inner === "::a9fe:a9fe" // IPv4-compatible 169.254.169.254
  );
}

export function isCloudMetadataHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    METADATA_HOSTNAMES.has(normalized) ||
    isCloudMetadataIpv4(normalized) ||
    isCloudMetadataIpv6(normalized)
  );
}

/**
 * 解析 Base URL 的源站（协议 + 主机 + 端口）。无法解析时返回 null。
 */
export function resolveAiBaseUrlOrigin(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

/**
 * 已经保存的 API Key 能否继续沿用。
 *
 * 只有源站完全一致（协议、主机、端口都没变）时才允许复用；仅调整路径不受影响。
 * 协议降级（https → http）同样算变更，否则密钥会以明文方式被发出去。
 */
export function canReuseStoredAiApiKey(input: {
  existingBaseUrl: string | null | undefined;
  nextBaseUrl: string | null | undefined;
}) {
  const existingOrigin = resolveAiBaseUrlOrigin(input.existingBaseUrl);
  const nextOrigin = resolveAiBaseUrlOrigin(input.nextBaseUrl);

  if (!existingOrigin || !nextOrigin) {
    return false;
  }

  return existingOrigin === nextOrigin;
}
