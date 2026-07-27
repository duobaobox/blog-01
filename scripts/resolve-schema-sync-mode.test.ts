import assert from "node:assert/strict";
import test from "node:test";
import {
  assertRequestedModeMatchesDecision,
  deriveAutoSchemaSyncDecision,
  parseCliArgs,
  PRISMA_BASELINE_MIGRATION,
  resolveRequestedSchemaSyncModeFromEnvironment,
} from "./resolve-schema-sync-mode.mjs";

test("auto schema sync prefers migrate for empty databases", () => {
  const result = deriveAutoSchemaSyncDecision({
    hasMigrationsTable: false,
    tableCount: 0,
    appliedMigrationNames: [],
    filesystemMigrationNames: [],
    unfinishedMigrationNames: [],
  });

  assert.equal(result.mode, "migrate");
  assert.equal(result.environmentKind, "empty");
});

test("auto schema sync keeps legacy populated databases on push until baseline is resolved", () => {
  const result = deriveAutoSchemaSyncDecision({
    hasMigrationsTable: false,
    tableCount: 12,
    appliedMigrationNames: [],
    filesystemMigrationNames: [],
    unfinishedMigrationNames: [],
  });

  assert.equal(result.mode, "push");
  assert.equal(result.environmentKind, "legacy-without-history");
});

test("auto schema sync reports baseline-ready when only baseline is applied", () => {
  const result = deriveAutoSchemaSyncDecision({
    hasMigrationsTable: true,
    tableCount: 12,
    appliedMigrationNames: [PRISMA_BASELINE_MIGRATION],
    filesystemMigrationNames: [
      PRISMA_BASELINE_MIGRATION,
      "20260615142000_add_post_media_references",
    ],
    unfinishedMigrationNames: [],
  });

  assert.equal(result.mode, "migrate");
  assert.equal(result.environmentKind, "baseline-ready");
});

test("auto schema sync reports migration-ready when all filesystem migrations are applied", () => {
  const result = deriveAutoSchemaSyncDecision({
    hasMigrationsTable: true,
    tableCount: 12,
    appliedMigrationNames: [
      PRISMA_BASELINE_MIGRATION,
      "20260615142000_add_post_media_references",
    ],
    filesystemMigrationNames: [
      PRISMA_BASELINE_MIGRATION,
      "20260615142000_add_post_media_references",
    ],
    unfinishedMigrationNames: [],
  });

  assert.equal(result.mode, "migrate");
  assert.equal(result.environmentKind, "migration-ready");
});

test("auto schema sync fails closed when migration state is blocked", () => {
  const result = deriveAutoSchemaSyncDecision({
    hasMigrationsTable: true,
    tableCount: 12,
    appliedMigrationNames: [],
    filesystemMigrationNames: [],
    unfinishedMigrationNames: [PRISMA_BASELINE_MIGRATION],
  });

  assert.equal(result.mode, "blocked");
  assert.equal(result.environmentKind, "migration-blocked");
});

test("requested schema sync mode resolves from explicit environment mode first", () => {
  assert.deepEqual(
    resolveRequestedSchemaSyncModeFromEnvironment({
      DB_SCHEMA_SYNC_MODE: "migrate",
      RUN_DB_PUSH: "1",
      DATABASE_URL: "postgresql://demo",
    }),
    {
      mode: "migrate",
      source: "DB_SCHEMA_SYNC_MODE",
    },
  );
});

test("requested schema sync mode falls back to auto and legacy compatibility sources", () => {
  assert.deepEqual(
    resolveRequestedSchemaSyncModeFromEnvironment({
      RUN_DB_PUSH: "1",
      DATABASE_URL: "postgresql://demo",
    }),
    {
      mode: "push",
      source: "RUN_DB_PUSH",
    },
  );

  assert.deepEqual(
    resolveRequestedSchemaSyncModeFromEnvironment({
      DB_SCHEMA_SYNC_MODE: "auto",
      DATABASE_URL: "postgresql://demo",
    }),
    {
      mode: "auto",
      source: "DB_SCHEMA_SYNC_MODE(auto)",
    },
  );
});

test("assertRequestedModeMatchesDecision accepts matching fixed mode and skips auto mode", () => {
  assert.deepEqual(
    assertRequestedModeMatchesDecision({
      requestedMode: "push",
      requestedModeSource: "DB_SCHEMA_SYNC_MODE",
      resolvedMode: "push",
    }),
    {
      checked: true,
      matches: true,
      reason: "requested mode push matches recommended mode",
    },
  );

  assert.deepEqual(
    assertRequestedModeMatchesDecision({
      requestedMode: "auto",
      requestedModeSource: "DB_SCHEMA_SYNC_MODE(auto)",
      resolvedMode: "migrate",
    }),
    {
      checked: false,
      matches: true,
      reason:
        "requested mode auto does not enforce a fixed effective schema sync mode",
    },
  );
});

test("assertRequestedModeMatchesDecision rejects mismatched fixed modes", () => {
  assert.throws(
    () =>
      assertRequestedModeMatchesDecision({
        requestedMode: "migrate",
        requestedModeSource: "DB_SCHEMA_SYNC_MODE",
        resolvedMode: "push",
      }),
    /does not match recommended mode push/,
  );
});

test("parseCliArgs supports details and assert-env-mode flags", () => {
  assert.deepEqual(parseCliArgs(["--details", "--assert-env-mode"]), {
    printDetails: true,
    assertEnvMode: true,
  });

  assert.throws(() => parseCliArgs(["--wat"]), /Unsupported args: --wat/);
});
