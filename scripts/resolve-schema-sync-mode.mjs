import { Client } from "pg";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { deriveSchemaSyncRecommendationCore } from "../src/shared/lib/db-schema-sync-mode-core.mjs";

export const PRISMA_BASELINE_MIGRATION = "20260615062322_baseline_init";
const SUPPORTED_SCHEMA_SYNC_MODES = ["auto", "push", "migrate", "skip"];
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PRISMA_MIGRATIONS_DIR = resolve(SCRIPT_DIR, "../prisma/migrations");

export function getDatabaseSchemaFromUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  return url.searchParams.get("schema") || "public";
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}

export function deriveAutoSchemaSyncDecision(snapshot) {
  const recommendation = deriveSchemaSyncRecommendationCore({
    hasMigrationsTable: snapshot.hasMigrationsTable,
    tableCount: snapshot.tableCount,
    hasBaselineMigration:
      snapshot.hasMigrationsTable &&
      snapshot.appliedMigrationNames.includes(PRISMA_BASELINE_MIGRATION),
    hasAllMigrationsApplied: Boolean(
      snapshot.hasMigrationsTable &&
      snapshot.filesystemMigrationNames.length > 0 &&
      snapshot.filesystemMigrationNames.every((migrationName) =>
        snapshot.appliedMigrationNames.includes(migrationName)
      ),
    ),
    hasUnfinishedMigrations: snapshot.unfinishedMigrationNames.length > 0,
  });

  return {
    mode: recommendation.recommendedMode,
    environmentKind: recommendation.environmentKind,
    rationale: recommendation.rationale,
  };
}

export async function loadSchemaSyncSnapshotFromDatabase(databaseUrl) {
  const targetSchema = getDatabaseSchemaFromUrl(databaseUrl);
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const hasMigrationsTableResult = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = $1
          AND table_name = '_prisma_migrations'
      ) AS "exists"
    `, [targetSchema]);
    const hasMigrationsTable = Boolean(
      hasMigrationsTableResult.rows[0]?.exists,
    );

    const tableCountResult = await client.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
    `, [targetSchema]);
    const tableCount = Number(tableCountResult.rows[0]?.count ?? 0);

    if (!hasMigrationsTable) {
      return {
        hasMigrationsTable,
        tableCount,
        appliedMigrationNames: [],
        filesystemMigrationNames: await loadFilesystemMigrationNames(),
        unfinishedMigrationNames: [],
      };
    }

    const migrationRowsResult = await client.query(`
      SELECT
        migration_name,
        finished_at,
        rolled_back_at
      FROM "${targetSchema}"."_prisma_migrations"
      ORDER BY started_at ASC, migration_name ASC
    `);

    const appliedMigrationNames = [];
    const unfinishedMigrationNames = [];

    for (const row of migrationRowsResult.rows) {
      if (row.rolled_back_at) {
        continue;
      }

      if (row.finished_at) {
        appliedMigrationNames.push(row.migration_name);
        continue;
      }

      unfinishedMigrationNames.push(row.migration_name);
    }

    return {
      hasMigrationsTable,
      tableCount,
      appliedMigrationNames,
      filesystemMigrationNames: await loadFilesystemMigrationNames(),
      unfinishedMigrationNames,
    };
  } finally {
    await client.end();
  }
}

export async function loadFilesystemMigrationNames() {
  const entries = await readdir(PRISMA_MIGRATIONS_DIR, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function parseSchemaSyncSnapshotOverride(rawValue) {
  const parsed = JSON.parse(rawValue);
  return {
    hasMigrationsTable: Boolean(parsed?.hasMigrationsTable),
    tableCount: Number(parsed?.tableCount ?? 0),
    appliedMigrationNames: normalizeStringArray(parsed?.appliedMigrationNames),
    filesystemMigrationNames: normalizeStringArray(parsed?.filesystemMigrationNames),
    unfinishedMigrationNames: normalizeStringArray(parsed?.unfinishedMigrationNames),
  };
}

export async function resolveSchemaSyncDecisionFromEnvironment(
  env = process.env,
) {
  const snapshot = env.SCHEMA_SYNC_PROBE_SNAPSHOT_JSON
    ? parseSchemaSyncSnapshotOverride(env.SCHEMA_SYNC_PROBE_SNAPSHOT_JSON)
    : await loadSchemaSyncSnapshotFromDatabase(env.DATABASE_URL);

  return deriveAutoSchemaSyncDecision(snapshot);
}

export function resolveRequestedSchemaSyncModeFromEnvironment(env = process.env) {
  if (env.DB_SCHEMA_SYNC_MODE && env.DB_SCHEMA_SYNC_MODE !== "auto") {
    return {
      mode: env.DB_SCHEMA_SYNC_MODE,
      source: "DB_SCHEMA_SYNC_MODE",
    };
  }

  if (env.RUN_DB_PUSH === "1") {
    return {
      mode: "push",
      source: "RUN_DB_PUSH",
    };
  }

  if (env.DB_SCHEMA_SYNC_MODE === "auto") {
    return {
      mode: "auto",
      source: "DB_SCHEMA_SYNC_MODE(auto)",
    };
  }

  if (env.DATABASE_URL) {
    return {
      mode: "auto",
      source: "auto",
    };
  }

  return {
    mode: "skip",
    source: "default",
  };
}

export function parseCliArgs(argv) {
  const options = {
    printDetails: false,
    assertEnvMode: false,
  };

  for (const arg of argv) {
    if (arg === "--details") {
      options.printDetails = true;
      continue;
    }

    if (arg === "--assert-env-mode") {
      options.assertEnvMode = true;
      continue;
    }

    throw new Error(`Unsupported args: ${arg}`);
  }

  return options;
}

export function assertRequestedModeMatchesDecision(input) {
  const { requestedMode, requestedModeSource, resolvedMode } = input;

  if (!SUPPORTED_SCHEMA_SYNC_MODES.includes(requestedMode)) {
    throw new Error(`Unsupported schema sync mode: ${requestedMode}`);
  }

  if (requestedMode === "auto" || requestedMode === "skip") {
    return {
      checked: false,
      matches: true,
      reason: `requested mode ${requestedMode} does not enforce a fixed effective schema sync mode`,
    };
  }

  if (requestedMode !== resolvedMode) {
    throw new Error(
      `Requested schema sync mode ${requestedMode} from ${requestedModeSource} does not match recommended mode ${resolvedMode}.`,
    );
  }

  return {
    checked: true,
    matches: true,
    reason: `requested mode ${requestedMode} matches recommended mode`,
  };
}

export async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const details = await resolveSchemaSyncDecisionFromEnvironment(process.env);
  const requested = resolveRequestedSchemaSyncModeFromEnvironment(process.env);

  if (options.assertEnvMode) {
    assertRequestedModeMatchesDecision({
      requestedMode: requested.mode,
      requestedModeSource: requested.source,
      resolvedMode: details.mode,
    });
  }

  if (options.printDetails) {
    console.log(`mode=${details.mode}`);
    console.log(`environment_kind=${details.environmentKind}`);
    console.log(`rationale=${details.rationale}`);
    console.log(`requested_mode=${requested.mode}`);
    console.log(`requested_mode_source=${requested.source}`);
    return;
  }

  console.log(details.mode);
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
