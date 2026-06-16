import "dotenv/config";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Client } from "pg";
import { fileURLToPath } from "node:url";
import { getDatabaseSchemaFromUrl } from "@/shared/lib/database-url";
import { summarizeMigrationCoverage } from "@/shared/lib/migration-coverage";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PRISMA_MIGRATIONS_DIR = resolve(SCRIPT_DIR, "../prisma/migrations");

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
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

async function loadAppliedMigrationNames() {
  const targetSchema = getDatabaseSchemaFromUrl(process.env.DATABASE_URL!);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
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

    if (!hasMigrationsTableResult.rows[0]?.exists) {
      return [];
    }

    const migrationRows = (
      await client.query<MigrationRow>(`
        SELECT migration_name, finished_at, rolled_back_at
        FROM "${targetSchema}"."_prisma_migrations"
        ORDER BY started_at ASC, migration_name ASC
      `)
    ).rows;

    return migrationRows
      .filter((row) => Boolean(row.finished_at) && !row.rolled_back_at)
      .map((row) => row.migration_name);
  } finally {
    await client.end();
  }
}

async function main() {
  const [filesystemMigrationNames, appliedMigrationNames] = await Promise.all([
    loadFilesystemMigrationNames(),
    loadAppliedMigrationNames(),
  ]);

  const coverage = summarizeMigrationCoverage({
    filesystemMigrationNames,
    appliedMigrationNames,
  });

  console.log("Checking migration coverage...");
  console.log(`  filesystem migrations: ${coverage.filesystemMigrationNames.length}`);
  console.log(`  applied migrations: ${coverage.appliedMigrationNames.length}`);
  console.log(`  fully applied: ${coverage.fullyApplied ? "yes" : "no"}`);

  if (coverage.missingMigrationNames.length > 0) {
    console.log("  missing migrations:");
    for (const migrationName of coverage.missingMigrationNames) {
      console.log(`    - ${migrationName}`);
    }
  }

  if (coverage.extraAppliedMigrationNames.length > 0) {
    console.log("  extra applied migrations:");
    for (const migrationName of coverage.extraAppliedMigrationNames) {
      console.log(`    - ${migrationName}`);
    }
  }

  if (!coverage.fullyApplied) {
    throw new Error(
      "Database migration coverage is incomplete. Apply the missing migrations before treating this environment as fully migration-ready.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
