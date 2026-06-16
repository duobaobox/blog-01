import "dotenv/config";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Client } from "pg";
import { fileURLToPath } from "node:url";
import {
  buildMigrationBaselinePlan,
  PRISMA_BASELINE_MIGRATION,
} from "@/features/settings/lib/migration-baseline";
import { getDatabaseSchemaFromUrl } from "@/shared/lib/database-url";
import { deriveSchemaSyncRecommendation } from "@/shared/lib/db-schema-sync-mode";
import { summarizeMigrationCoverage } from "@/shared/lib/migration-coverage";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PRISMA_MIGRATIONS_DIR = resolve(SCRIPT_DIR, "../prisma/migrations");

type ExistsRow = {
  exists: boolean;
};

type CountRow = {
  count: string;
};

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
  logs: string | null;
};

async function loadFilesystemMigrationNames() {
  const entries = await readdir(PRISMA_MIGRATIONS_DIR, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  const targetSchema = getDatabaseSchemaFromUrl(process.env.DATABASE_URL!);
  const filesystemMigrationNames = await loadFilesystemMigrationNames();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    const [{ exists: hasMigrationsTable }] = (
      await client.query<ExistsRow>(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = ${`'${targetSchema}'`}
            AND table_name = '_prisma_migrations'
        ) AS "exists"
      `)
    ).rows;

    const [{ count: tableCountRaw }] = (
      await client.query<CountRow>(`
        SELECT COUNT(*) AS count
        FROM information_schema.tables
        WHERE table_schema = ${`'${targetSchema}'`}
          AND table_type = 'BASE TABLE'
      `)
    ).rows;

    const tableCount = Number(tableCountRaw);

    console.log("Checking Prisma migration state...");
    console.log(`  target schema: ${targetSchema}`);
    console.log(`  schema tables: ${tableCount}`);
    console.log(`  _prisma_migrations present: ${hasMigrationsTable ? "yes" : "no"}`);

    if (!hasMigrationsTable) {
      const baselinePlan = buildMigrationBaselinePlan({
        hasMigrationsTable,
        tableCount,
        appliedMigrationNames: [],
        pendingMigrationNames: [],
        unfinishedMigrationNames: [],
      });
      const schemaSyncRecommendation = deriveSchemaSyncRecommendation({
        snapshot: {
          hasMigrationsTable,
          tableCount,
          appliedMigrationNames: [],
          pendingMigrationNames: [],
          unfinishedMigrationNames: [],
        },
        baselinePlan,
        filesystemMigrationNames,
      });

      if (tableCount === 0) {
        console.log("  status: empty database, ready for prisma migrate deploy.");
        console.log(`  baseline migration: ${PRISMA_BASELINE_MIGRATION}`);
        console.log(`  baseline plan: ${baselinePlan.status}`);
        console.log(`  environment kind: ${schemaSyncRecommendation.environmentKind}`);
        console.log(`  recommended DB_SCHEMA_SYNC_MODE: ${schemaSyncRecommendation.recommendedMode}`);
        console.log(`  rationale: ${schemaSyncRecommendation.rationale}`);
        return;
      }

      console.log("  status: schema exists but migration history is missing.");
      console.log("  next step: baseline this database with `prisma migrate resolve --applied <baseline-migration>` before switching to migrate deploy.");
      console.log(`  baseline migration: ${PRISMA_BASELINE_MIGRATION}`);
      console.log(`  baseline plan: ${baselinePlan.status}`);
      console.log(`  environment kind: ${schemaSyncRecommendation.environmentKind}`);
      console.log(`  recommended DB_SCHEMA_SYNC_MODE: ${schemaSyncRecommendation.recommendedMode}`);
      console.log(`  rationale: ${schemaSyncRecommendation.rationale}`);
      return;
    }

    const migrationRows = (
      await client.query<MigrationRow>(`
          SELECT
            migration_name,
            finished_at,
            rolled_back_at,
            logs
        FROM "${targetSchema}"."_prisma_migrations"
        ORDER BY started_at ASC, migration_name ASC
      `)
    ).rows;

    console.log(`  recorded migrations: ${migrationRows.length}`);

    if (migrationRows.length === 0) {
      console.log("  status: migration table exists but has no rows.");
      console.log("  next step: inspect the environment before trusting migrate deploy.");
      return;
    }

    const failedMigrations = migrationRows.filter((row) => {
      if (row.rolled_back_at) {
        return false;
      }

      return !row.finished_at;
    });

    for (const row of migrationRows) {
      const state = row.rolled_back_at
        ? "rolled_back"
        : row.finished_at
          ? "applied"
          : "pending_or_failed";
      console.log(`  migration ${row.migration_name}: ${state}`);
    }

    if (failedMigrations.length > 0) {
      throw new Error(
        `Found ${failedMigrations.length} unfinished migration(s): ${failedMigrations
          .map((row) => row.migration_name)
          .join(", ")}`,
      );
    }

    const baselinePlan = buildMigrationBaselinePlan({
      hasMigrationsTable,
      tableCount,
      appliedMigrationNames: migrationRows
        .filter((row) => Boolean(row.finished_at) && !row.rolled_back_at)
        .map((row) => row.migration_name),
      pendingMigrationNames: migrationRows
        .filter((row) => !row.finished_at && !row.rolled_back_at)
        .map((row) => row.migration_name),
      unfinishedMigrationNames: failedMigrations.map((row) => row.migration_name),
    });
    const appliedMigrationNames = migrationRows
      .filter((row) => Boolean(row.finished_at) && !row.rolled_back_at)
      .map((row) => row.migration_name);
    const pendingMigrationNames = migrationRows
      .filter((row) => !row.finished_at && !row.rolled_back_at)
      .map((row) => row.migration_name);
    const unfinishedMigrationNames = failedMigrations.map((row) => row.migration_name);
    const schemaSyncRecommendation = deriveSchemaSyncRecommendation({
      snapshot: {
        hasMigrationsTable,
        tableCount,
        appliedMigrationNames,
        pendingMigrationNames,
        unfinishedMigrationNames,
      },
      baselinePlan,
      filesystemMigrationNames,
    });
    const migrationCoverage = summarizeMigrationCoverage({
      filesystemMigrationNames,
      appliedMigrationNames,
    });

    console.log("  status: migration history exists and contains no unfinished rows.");
    console.log(`  filesystem migrations: ${filesystemMigrationNames.length}`);
    console.log(`  applied filesystem migrations: ${migrationCoverage.appliedMigrationNames.length}`);
    console.log(`  fully migration-ready: ${migrationCoverage.fullyApplied ? "yes" : "no"}`);
    console.log(`  baseline migration: ${PRISMA_BASELINE_MIGRATION}`);
    console.log(`  baseline plan: ${baselinePlan.status}`);
    console.log(`  environment kind: ${schemaSyncRecommendation.environmentKind}`);
    console.log(`  recommended DB_SCHEMA_SYNC_MODE: ${schemaSyncRecommendation.recommendedMode}`);
    console.log(`  rationale: ${schemaSyncRecommendation.rationale}`);

    if (migrationCoverage.missingMigrationNames.length > 0) {
      console.log("  missing repository migrations:");
      for (const migrationName of migrationCoverage.missingMigrationNames) {
        console.log(`    - ${migrationName}`);
      }
    }

    if (migrationCoverage.extraAppliedMigrationNames.length > 0) {
      console.log("  extra applied migrations not found in repository:");
      for (const migrationName of migrationCoverage.extraAppliedMigrationNames) {
        console.log(`    - ${migrationName}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
