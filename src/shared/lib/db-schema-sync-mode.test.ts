import assert from "node:assert/strict";
import test from "node:test";
import { deriveSchemaSyncRecommendation } from "./db-schema-sync-mode";
import { PRISMA_BASELINE_MIGRATION } from "@/features/settings/lib/migration-baseline";

test("schema sync recommendation prefers migrate for empty databases", () => {
  const result = deriveSchemaSyncRecommendation({
    snapshot: {
      hasMigrationsTable: false,
      tableCount: 0,
      appliedMigrationNames: [],
      pendingMigrationNames: [],
      unfinishedMigrationNames: [],
    },
    baselinePlan: {
      status: "empty",
      baselineMigration: PRISMA_BASELINE_MIGRATION,
      reasons: [],
      recommendedCommands: [],
    },
    filesystemMigrationNames: [],
  });

  assert.equal(result.environmentKind, "empty");
  assert.equal(result.recommendedMode, "migrate");
});

test("schema sync recommendation keeps legacy populated databases on push until baseline is resolved", () => {
  const result = deriveSchemaSyncRecommendation({
    snapshot: {
      hasMigrationsTable: false,
      tableCount: 12,
      appliedMigrationNames: [],
      pendingMigrationNames: [],
      unfinishedMigrationNames: [],
    },
    baselinePlan: {
      status: "baseline-required",
      baselineMigration: PRISMA_BASELINE_MIGRATION,
      reasons: [],
      recommendedCommands: [],
    },
    filesystemMigrationNames: [],
  });

  assert.equal(result.environmentKind, "legacy-without-history");
  assert.equal(result.recommendedMode, "push");
});

test("schema sync recommendation reports baseline-ready when baseline exists but later repo migrations are still missing", () => {
  const result = deriveSchemaSyncRecommendation({
    snapshot: {
      hasMigrationsTable: true,
      tableCount: 12,
      appliedMigrationNames: [PRISMA_BASELINE_MIGRATION],
      pendingMigrationNames: [],
      unfinishedMigrationNames: [],
    },
    baselinePlan: {
      status: "ready",
      baselineMigration: PRISMA_BASELINE_MIGRATION,
      reasons: [],
      recommendedCommands: [],
    },
    filesystemMigrationNames: [
      PRISMA_BASELINE_MIGRATION,
      "20260615142000_add_post_media_references",
    ],
  });

  assert.equal(result.environmentKind, "baseline-ready");
  assert.equal(result.recommendedMode, "migrate");
});

test("schema sync recommendation reports migration-ready when repository migrations are fully applied", () => {
  const result = deriveSchemaSyncRecommendation({
    snapshot: {
      hasMigrationsTable: true,
      tableCount: 12,
      appliedMigrationNames: [
        PRISMA_BASELINE_MIGRATION,
        "20260615142000_add_post_media_references",
      ],
      pendingMigrationNames: [],
      unfinishedMigrationNames: [],
    },
    baselinePlan: {
      status: "ready",
      baselineMigration: PRISMA_BASELINE_MIGRATION,
      reasons: [],
      recommendedCommands: [],
    },
    filesystemMigrationNames: [
      PRISMA_BASELINE_MIGRATION,
      "20260615142000_add_post_media_references",
    ],
  });

  assert.equal(result.environmentKind, "migration-ready");
  assert.equal(result.recommendedMode, "migrate");
});

test("schema sync recommendation falls back to push when migration state is blocked", () => {
  const result = deriveSchemaSyncRecommendation({
    snapshot: {
      hasMigrationsTable: true,
      tableCount: 12,
      appliedMigrationNames: [],
      pendingMigrationNames: [],
      unfinishedMigrationNames: ["20260615062322_baseline_init"],
    },
    baselinePlan: {
      status: "blocked",
      baselineMigration: PRISMA_BASELINE_MIGRATION,
      reasons: [],
      recommendedCommands: [],
    },
    filesystemMigrationNames: [PRISMA_BASELINE_MIGRATION],
  });

  assert.equal(result.environmentKind, "migration-blocked");
  assert.equal(result.recommendedMode, "push");
});
