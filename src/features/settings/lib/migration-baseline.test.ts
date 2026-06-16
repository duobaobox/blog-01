import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMigrationBaselinePlan,
  parseBaselineCliArgs,
  PRISMA_BASELINE_MIGRATION,
} from "./migration-baseline";

test("buildMigrationBaselinePlan marks populated legacy databases as baseline-required", () => {
  const plan = buildMigrationBaselinePlan({
    hasMigrationsTable: false,
    tableCount: 13,
    appliedMigrationNames: [],
    pendingMigrationNames: [],
    unfinishedMigrationNames: [],
  });

  assert.equal(plan.status, "baseline-required");
  assert.equal(plan.baselineMigration, PRISMA_BASELINE_MIGRATION);
});

test("buildMigrationBaselinePlan marks empty databases as migrate-ready", () => {
  const plan = buildMigrationBaselinePlan({
    hasMigrationsTable: false,
    tableCount: 0,
    appliedMigrationNames: [],
    pendingMigrationNames: [],
    unfinishedMigrationNames: [],
  });

  assert.equal(plan.status, "empty");
  assert.deepEqual(plan.recommendedCommands, ["npx prisma migrate deploy"]);
});

test("buildMigrationBaselinePlan marks baseline-applied environments as ready", () => {
  const plan = buildMigrationBaselinePlan({
    hasMigrationsTable: true,
    tableCount: 14,
    appliedMigrationNames: [PRISMA_BASELINE_MIGRATION],
    pendingMigrationNames: [],
    unfinishedMigrationNames: [],
  });

  assert.equal(plan.status, "ready");
});

test("parseBaselineCliArgs parses supported flags", () => {
  assert.deepEqual(parseBaselineCliArgs(["--apply", "--json"]), {
    apply: true,
    printJson: true,
  });
});
