import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { getAiProviderPreset } from "@/features/ai/lib/ai-provider-presets";
import type { AdminAiSettingsPageData } from "@/features/ai/queries/ai-settings.queries";

type AiSettings = AdminAiSettingsPageData["settings"];

type AiSettingsSummaryProps = {
  settings: AiSettings;
};

function isAiConfigured(settings: AiSettings) {
  return Boolean(
    settings?.aiConfigured &&
    settings.aiApiKeyConfigured &&
    settings.aiBaseUrl &&
    settings.aiModel,
  );
}

/** "#4D6BFE" -> "77, 107, 254"，供 rgba(var(--brand-rgb), alpha) 使用 */
function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function AiSettingsSummary({ settings }: AiSettingsSummaryProps) {
  const configured = isAiConfigured(settings);
  const currentPreset = settings?.aiProvider
    ? getAiProviderPreset(settings.aiProvider)
    : null;
  const brand = configured && currentPreset?.brand ? currentPreset.brand : null;
  const brandVars = brand
    ? ({ "--brand-rgb": hexToRgb(brand.color) } as CSSProperties)
    : undefined;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card">
      {brand ? (
        <>
          {/* 右上角主灵光 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_130%_at_100%_0%,rgba(var(--brand-rgb),0.12),transparent_60%)] dark:bg-[radial-gradient(90%_130%_at_100%_0%,rgba(var(--brand-rgb),0.2),transparent_60%)]"
            style={brandVars}
          />
          {/* 左下角辅光，形成对角层次 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_0%_100%,rgba(var(--brand-rgb),0.07),transparent_60%)] dark:bg-[radial-gradient(70%_90%_at_0%_100%,rgba(var(--brand-rgb),0.12),transparent_60%)]"
            style={brandVars}
          />
          {/* 顶部一线灵光 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(var(--brand-rgb),0.4),transparent)]"
            style={brandVars}
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        />
      )}

      <div className="relative flex flex-wrap items-start justify-between gap-5 px-6 py-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              当前模型
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {configured
                ? (currentPreset?.name ?? settings?.aiProvider)
                : "尚未选择服务商"}
            </p>
            <p className="mt-0.5 truncate text-xl font-semibold tracking-tight">
              {configured ? settings?.aiModel : "尚未绑定模型"}
            </p>
          </div>
        </div>

        <div
          className={
            configured
              ? "flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400"
              : "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground"
          }
        >
          <span
            className={
              configured
                ? "size-2 rounded-full bg-emerald-500"
                : "size-2 rounded-full bg-muted-foreground/40"
            }
            aria-hidden="true"
          />
          {configured ? "已绑定" : "未绑定"}
        </div>
      </div>

      <dl className="relative grid border-t border-border/70 sm:grid-cols-3">
        <div className="min-w-0 px-6 py-4">
          <dt className="text-xs text-muted-foreground">Base URL</dt>
          <dd className="mt-1 truncate font-mono text-xs">
            {settings?.aiBaseUrl || "—"}
          </dd>
        </div>
        <div className="min-w-0 border-t border-border/70 px-6 py-4 sm:border-l sm:border-t-0">
          <dt className="text-xs text-muted-foreground">接口协议</dt>
          <dd className="mt-1 text-sm font-medium">
            {settings?.aiProtocol === "chat-completions"
              ? "Chat Completions"
              : settings?.aiProtocol || "—"}
          </dd>
        </div>
        <div className="min-w-0 border-t border-border/70 px-6 py-4 sm:border-l sm:border-t-0">
          <dt className="text-xs text-muted-foreground">API Key</dt>
          <dd className="mt-1 text-sm font-medium">
            {settings?.aiApiKeyConfigured ? "已加密保存" : "尚未设置"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
