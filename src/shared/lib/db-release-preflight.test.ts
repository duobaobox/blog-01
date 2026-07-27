import assert from "node:assert/strict";
import test from "node:test";
import {
  DB_MIGRATION_READINESS_MATRIX,
  DB_RELEASE_ENVIRONMENT_PATHS,
  buildDbReleasePreflightSteps,
  getDbReleasePreflightHelpText,
  getDbReleaseRequiredGateIds,
  parseDbReleasePreflightArgs,
} from "./db-release-preflight";

test("db release preflight args default to required checks only", () => {
  assert.deepEqual(parseDbReleasePreflightArgs([]), {
    includeSchemaDiff: false,
    includePostsExplain: false,
    includeMediaBackfillPlan: false,
    printHelp: false,
  });
});

test("db release preflight args expand --all into every optional check", () => {
  assert.deepEqual(parseDbReleasePreflightArgs(["--all"]), {
    includeSchemaDiff: true,
    includePostsExplain: true,
    includeMediaBackfillPlan: true,
    printHelp: false,
  });
});

test("db release preflight steps keep required checks first and append requested optional checks", () => {
  const steps = buildDbReleasePreflightSteps({
    includeSchemaDiff: true,
    includePostsExplain: false,
    includeMediaBackfillPlan: true,
    printHelp: false,
  });

  assert.deepEqual(
    steps.map((step) => step.id),
    [
      "check-sync-mode",
      "check-migrations",
      "check-migration-coverage",
      "baseline-plan",
      "check-site-settings",
      "schema-diff",
      "media-backfill-plan",
    ],
  );
  assert.deepEqual(steps[0]?.command, [
    "run",
    "db:check:sync-mode",
    "--",
    "--assert-env-mode",
  ]);
});

test("db release preflight required gates cover every release decision dependency", () => {
  const steps = buildDbReleasePreflightSteps({
    includeSchemaDiff: false,
    includePostsExplain: false,
    includeMediaBackfillPlan: false,
    printHelp: false,
  });

  assert.deepEqual(
    steps.filter((step) => !step.optional).map((step) => step.id),
    getDbReleaseRequiredGateIds(),
  );
  assert.deepEqual(getDbReleaseRequiredGateIds(), [
    "check-sync-mode",
    "check-migrations",
    "check-migration-coverage",
    "baseline-plan",
    "check-site-settings",
  ]);
});

test("db release preflight distinguishes baseline-ready from fully migration-ready", () => {
  const baselineReady = DB_MIGRATION_READINESS_MATRIX.find(
    (mode) => mode.environmentKind === "baseline-ready",
  );
  const migrationReady = DB_MIGRATION_READINESS_MATRIX.find(
    (mode) => mode.environmentKind === "migration-ready",
  );

  assert.ok(baselineReady);
  assert.ok(migrationReady);
  assert.notEqual(baselineReady.releaseClaim, migrationReady.releaseClaim);
  assert.match(
    baselineReady.operationalMeaning,
    /may still need later repository migrations/,
  );
  assert.match(
    migrationReady.requiredEvidence.join("\n"),
    /migration-coverage reports fully applied/,
  );
});

test("db release preflight help text documents the new unified entrypoint", () => {
  assert.match(
    getDbReleasePreflightHelpText(),
    /npm run db:preflight:release -- \[--schema\] \[--posts\] \[--media\] \[--all\]/,
  );
  assert.match(getDbReleasePreflightHelpText(), /db:check:sync-mode/);
  assert.match(getDbReleasePreflightHelpText(), /db:check:migration-coverage/);
  assert.match(getDbReleasePreflightHelpText(), /Migration readiness:/);
});

test("db release preflight documents every supported database release path", () => {
  assert.deepEqual(
    DB_RELEASE_ENVIRONMENT_PATHS.map((path) => path.id),
    [
      "new-environment",
      "legacy-baseline-transition",
      "migration-managed",
      "blocked-environment",
    ],
  );

  assert.match(getDbReleasePreflightHelpText(), /environment kind: empty/);
  assert.match(
    getDbReleasePreflightHelpText(),
    /environment kind: legacy-without-history/,
  );
  assert.match(
    getDbReleasePreflightHelpText(),
    /environment kind: baseline-ready, migration-ready/,
  );
  assert.match(
    getDbReleasePreflightHelpText(),
    /environment kind: migration-blocked/,
  );
});
