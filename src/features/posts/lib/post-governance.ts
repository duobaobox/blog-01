export const POST_GOVERNANCE_DEBT_KEYS = [
  "uncategorized",
  "untagged",
  "unfiled",
  "missingExcerpt",
  "missingSeoTitle",
  "missingSeoDescription",
] as const;

export type PostGovernanceDebtKey = (typeof POST_GOVERNANCE_DEBT_KEYS)[number];

export type PostGovernanceDebtDefinition = {
  key: PostGovernanceDebtKey;
  label: string;
  description: string;
  emphasis: string;
  emptyTitle: string;
};

export const POST_GOVERNANCE_DEBT_DEFINITIONS: PostGovernanceDebtDefinition[] = [
  {
    key: "uncategorized",
    label: "无分类",
    description: "还没有归类的文章",
    emphasis: "优先补齐分类，建立稳定的信息架构",
    emptyTitle: "没有未分类文章",
  },
  {
    key: "untagged",
    label: "无标签",
    description: "还没有添加标签的文章",
    emphasis: "优先补齐标签，提升主题聚合和检索能力",
    emptyTitle: "没有未打标签的文章",
  },
  {
    key: "unfiled",
    label: "未归档",
    description: "还没有放入文件夹的文章",
    emphasis: "优先整理文件夹归属，减少内容散落",
    emptyTitle: "没有未归档文章",
  },
  {
    key: "missingExcerpt",
    label: "缺摘要",
    description: "还没有摘要的文章",
    emphasis: "优先补齐摘要，提升列表预览和分享表现",
    emptyTitle: "没有缺摘要的文章",
  },
  {
    key: "missingSeoTitle",
    label: "缺 SEO 标题",
    description: "还没有 SEO 标题的文章",
    emphasis: "优先补齐 SEO 标题，明确搜索结果呈现",
    emptyTitle: "没有缺 SEO 标题的文章",
  },
  {
    key: "missingSeoDescription",
    label: "缺 SEO 描述",
    description: "还没有 SEO 描述的文章",
    emphasis: "优先补齐 SEO 描述，提升搜索摘要质量",
    emptyTitle: "没有缺 SEO 描述的文章",
  },
];

export function isPostGovernanceDebtKey(
  value: string | undefined,
): value is PostGovernanceDebtKey {
  return POST_GOVERNANCE_DEBT_KEYS.includes(value as PostGovernanceDebtKey);
}

export function getPostGovernanceDebtDefinition(
  key: PostGovernanceDebtKey,
) {
  return POST_GOVERNANCE_DEBT_DEFINITIONS.find((item) => item.key === key);
}
