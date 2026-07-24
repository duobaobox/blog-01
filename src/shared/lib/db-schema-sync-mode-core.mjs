export function deriveSchemaSyncRecommendationCore(input) {
  if (input.hasUnfinishedMigrations) {
    return {
      environmentKind: "migration-blocked",
      recommendedMode: "blocked",
      rationale:
        "当前 migration 历史存在未完成状态，必须先修复或回滚异常 migration，禁止继续执行 db push 或 migrate deploy。",
    };
  }

  if (!input.hasMigrationsTable && input.tableCount === 0) {
    return {
      environmentKind: "empty",
      recommendedMode: "migrate",
      rationale:
        "当前数据库为空，可直接用 Prisma Migrate 建立结构，不需要继续依赖 db push。",
    };
  }

  if (input.hasAllMigrationsApplied) {
    return {
      environmentKind: "migration-ready",
      recommendedMode: "migrate",
      rationale:
        "当前环境已经记录并应用了仓库里的全部 migration，可继续安全执行 migrate deploy。",
    };
  }

  if (input.hasBaselineMigration) {
    return {
      environmentKind: "baseline-ready",
      recommendedMode: "migrate",
      rationale:
        "baseline migration 已记录，当前环境已经具备继续使用 migrate deploy 的前提，但仍建议确认仓库里的后续 migration 也已应用。",
    };
  }

  return {
    environmentKind: "legacy-without-history",
    recommendedMode: "push",
    rationale:
      "当前环境仍缺少完整 migration 历史，在 baseline resolve 完成前应继续按 push 兼容交付。",
  };
}
