import assert from "node:assert/strict";
import test from "node:test";
import { summarizeMigrationCoverage } from "./migration-coverage";

test("summarizeMigrationCoverage reports fully applied migration sets", () => {
  const result = summarizeMigrationCoverage({
    filesystemMigrationNames: [
      "20260615062322_baseline_init",
      "20260615142000_add_post_media_references",
    ],
    appliedMigrationNames: [
      "20260615142000_add_post_media_references",
      "20260615062322_baseline_init",
    ],
  });

  assert.equal(result.fullyApplied, true);
  assert.deepEqual(result.missingMigrationNames, []);
  assert.deepEqual(result.extraAppliedMigrationNames, []);
});

test("summarizeMigrationCoverage reports missing and extra migrations explicitly", () => {
  const result = summarizeMigrationCoverage({
    filesystemMigrationNames: [
      "20260615062322_baseline_init",
      "20260615142000_add_post_media_references",
    ],
    appliedMigrationNames: [
      "20260615062322_baseline_init",
      "20260616090000_manual_hotfix",
    ],
  });

  assert.equal(result.fullyApplied, false);
  assert.deepEqual(result.missingMigrationNames, [
    "20260615142000_add_post_media_references",
  ]);
  assert.deepEqual(result.extraAppliedMigrationNames, [
    "20260616090000_manual_hotfix",
  ]);
});
