export function getTopicRowActionModel(input: {
  expanded: boolean;
  active: boolean;
  subtopicCount: number;
}) {
  return {
    toggleLabel: input.expanded ? "收起专题" : "展开专题",
    selectLabel: input.active ? "查看当前专题" : "进入专题",
    badgeText: String(input.subtopicCount),
  };
}

export function getSubtopicRowActionModel(input: {
  expanded: boolean;
  active: boolean;
  postCount: number;
  hiddenPostCount: number;
}) {
  return {
    toggleLabel: input.expanded ? "收起子专题" : "展开子专题",
    selectLabel: "进入子专题",
    badgeText: String(input.postCount),
    helperText:
      input.hiddenPostCount > 0 ? `还有 ${input.hiddenPostCount} 篇` : "",
  };
}
