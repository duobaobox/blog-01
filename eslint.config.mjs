import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const tiptapCompatibilityFiles = [
  "src/components/tiptap/**/*.{ts,tsx}",
  "src/hooks/use-element-rect.ts",
  "src/hooks/use-is-breakpoint.ts",
  "src/hooks/use-menu-navigation.ts",
  "src/hooks/use-throttled-callback.ts",
  "src/hooks/use-tiptap-editor.ts",
  "src/hooks/use-unmount.ts",
];

const externalStateSynchronizationFiles = [
  "src/components/admin/content-space-context-panel.tsx",
  "src/components/blog/table-of-contents.tsx",
  "src/features/media/components/media-picker-dialog.tsx",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // 这些文件来自 Tiptap UI 模板，其内部 Hook 模式尚未完全适配
    // React Compiler 的静态规则。保留常规 Hooks 规则，仅局部关闭
    // 会误判其既有实现的 Compiler 建议规则。
    files: tiptapCompatibilityFiles,
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
    },
  },
  {
    // 这些 effect 用于同步 URL hash、受控面板和弹窗生命周期等外部状态。
    files: externalStateSynchronizationFiles,
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/components/blog/table-of-contents.tsx"],
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["src/lib/tiptap-utils.ts"],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
