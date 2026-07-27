import type {
  MigrationBaselinePlan,
  MigrationStateSnapshot,
} from "@/features/settings/lib/migration-baseline";
import { deriveSchemaSyncRecommendationCore } from "@/shared/lib/db-schema-sync-mode-core.mjs";
import { summarizeMigrationCoverage } from "@/shared/lib/migration-coverage";

export type SchemaSyncMode = "push" | "migrate" | "skip";

export type SchemaSyncRecommendation = {
  environmentKind:
    | "empty"
    | "baseline-ready"
    | "legacy-without-history"
    | "migration-ready"
    | "migration-blocked";
  recommendedMode: Exclude<SchemaSyncMode, "skip">;
  rationale: string;
};

export function deriveSchemaSyncRecommendation(input: {
  snapshot: MigrationStateSnapshot;
  baselinePlan: MigrationBaselinePlan;
  filesystemMigrationNames?: string[];
}): SchemaSyncRecommendation {
  const { snapshot, baselinePlan, filesystemMigrationNames = [] } = input;
  const migrationCoverage = summarizeMigrationCoverage({
    filesystemMigrationNames,
    appliedMigrationNames: snapshot.appliedMigrationNames,
  });
  const recommendation = deriveSchemaSyncRecommendationCore({
    hasMigrationsTable: snapshot.hasMigrationsTable,
    tableCount: snapshot.tableCount,
    hasBaselineMigration: baselinePlan.status === "ready",
    hasAllMigrationsApplied:
      snapshot.hasMigrationsTable &&
      migrationCoverage.filesystemMigrationNames.length > 0 &&
      migrationCoverage.fullyApplied,
    hasUnfinishedMigrations: baselinePlan.status === "blocked",
  });

  return {
    environmentKind:
      recommendation.environmentKind as SchemaSyncRecommendation["environmentKind"],
    recommendedMode:
      recommendation.recommendedMode as SchemaSyncRecommendation["recommendedMode"],
    rationale: recommendation.rationale,
  };
}
