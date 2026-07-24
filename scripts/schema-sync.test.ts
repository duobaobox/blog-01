import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const workdir = process.cwd();

async function runSchemaSyncPrintMode(snapshot: object) {
  const { stdout } = await execFileAsync("sh", ["scripts/schema-sync.sh", "--print-mode"], {
    cwd: workdir,
    env: {
      ...process.env,
      DB_SCHEMA_SYNC_MODE: "auto",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/blog?schema=public",
      SCHEMA_SYNC_PROBE_SNAPSHOT_JSON: JSON.stringify(snapshot),
    },
  });

  return stdout;
}

async function runResolveSchemaSyncMode(args: string[], env: Record<string, string>) {
  return execFileAsync("node", ["scripts/resolve-schema-sync-mode.mjs", ...args], {
    cwd: workdir,
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://user:pass@localhost:5432/blog?schema=public",
      ...env,
    },
  });
}

test("schema-sync.sh auto mode resolves migrate for empty databases", async () => {
  const output = await runSchemaSyncPrintMode({
    hasMigrationsTable: false,
    tableCount: 0,
    appliedMigrationNames: [],
    filesystemMigrationNames: [],
    unfinishedMigrationNames: [],
  });

  assert.match(output, /Resolved DB schema sync mode: migrate/);
  assert.match(output, /environment kind: empty/);
});

test("schema-sync.sh auto mode resolves push for legacy databases without history", async () => {
  const output = await runSchemaSyncPrintMode({
    hasMigrationsTable: false,
    tableCount: 12,
    appliedMigrationNames: [],
    filesystemMigrationNames: [],
    unfinishedMigrationNames: [],
  });

  assert.match(output, /Resolved DB schema sync mode: push/);
  assert.match(output, /environment kind: legacy-without-history/);
});

test("schema-sync.sh auto mode resolves migrate for baseline-ready databases", async () => {
  const output = await runSchemaSyncPrintMode({
    hasMigrationsTable: true,
    tableCount: 12,
    appliedMigrationNames: ["20260615062322_baseline_init"],
    filesystemMigrationNames: [
      "20260615062322_baseline_init",
      "20260615142000_add_post_media_references",
    ],
    unfinishedMigrationNames: [],
  });

  assert.match(output, /Resolved DB schema sync mode: migrate/);
  assert.match(output, /environment kind: baseline-ready/);
});

test("schema-sync.sh reports blocked migration state without falling back to push", async () => {
  const output = await runSchemaSyncPrintMode({
    hasMigrationsTable: true,
    tableCount: 12,
    appliedMigrationNames: [],
    filesystemMigrationNames: ["20260615062322_baseline_init"],
    unfinishedMigrationNames: ["20260615062322_baseline_init"],
  });

  assert.match(output, /Resolved DB schema sync mode: blocked/);
  assert.match(output, /environment kind: migration-blocked/);
});

test("resolve-schema-sync-mode assertion passes when explicit mode matches recommendation", async () => {
  const result = await runResolveSchemaSyncMode(
    ["--details", "--assert-env-mode"],
    {
      DB_SCHEMA_SYNC_MODE: "push",
      SCHEMA_SYNC_PROBE_SNAPSHOT_JSON: JSON.stringify({
        hasMigrationsTable: false,
        tableCount: 12,
        appliedMigrationNames: [],
        filesystemMigrationNames: [],
        unfinishedMigrationNames: [],
      }),
    },
  );

  assert.match(result.stdout, /mode=push/);
  assert.match(result.stdout, /requested_mode=push/);
});

test("resolve-schema-sync-mode assertion fails when explicit mode conflicts with recommendation", async () => {
  await assert.rejects(
    () => runResolveSchemaSyncMode(
      ["--assert-env-mode"],
      {
        DB_SCHEMA_SYNC_MODE: "migrate",
        SCHEMA_SYNC_PROBE_SNAPSHOT_JSON: JSON.stringify({
          hasMigrationsTable: false,
          tableCount: 12,
          appliedMigrationNames: [],
          filesystemMigrationNames: [],
          unfinishedMigrationNames: [],
        }),
      },
    ),
    /does not match recommended mode push/,
  );
});
