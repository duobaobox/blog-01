import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "pg";
import {
  buildMigrationBaselinePlan,
  parseBaselineCliArgs,
  PRISMA_BASELINE_MIGRATION,
} from "@/features/settings/lib/migration-baseline";
import { getDatabaseSchemaFromUrl } from "@/shared/lib/database-url";

const execFileAsync = promisify(execFile);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

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
};

async function readSnapshot() {
  const targetSchema = getDatabaseSchemaFromUrl(process.env.DATABASE_URL!);
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

    let migrationRows: MigrationRow[] = [];

    if (hasMigrationsTable) {
      migrationRows = (
        await client.query<MigrationRow>(`
          SELECT migration_name, finished_at, rolled_back_at
          FROM "${targetSchema}"."_prisma_migrations"
          ORDER BY started_at ASC, migration_name ASC
        `)
      ).rows;
    }

    return {
      hasMigrationsTable,
      tableCount,
      appliedMigrationNames: migrationRows
        .filter((row) => Boolean(row.finished_at) && !row.rolled_back_at)
        .map((row) => row.migration_name),
      pendingMigrationNames: migrationRows
        .filter((row) => !row.finished_at && !row.rolled_back_at)
        .map((row) => row.migration_name),
      unfinishedMigrationNames: migrationRows
        .filter((row) => !row.finished_at && !row.rolled_back_at)
        .map((row) => row.migration_name),
    };
  } finally {
    await client.end();
  }
}

async function applyBaseline() {
  await execFileAsync(
    "npx",
    [
      "prisma",
      "migrate",
      "resolve",
      "--applied",
      PRISMA_BASELINE_MIGRATION,
      "--schema",
      "prisma/schema.prisma",
    ],
    {
      env: process.env,
    },
  );
}

async function main() {
  const args = parseBaselineCliArgs(process.argv.slice(2));
  const snapshot = await readSnapshot();
  const plan = buildMigrationBaselinePlan(snapshot);

  if (args.printJson) {
    console.log(JSON.stringify({ snapshot, plan }, null, 2));
    return;
  }

  console.log("Prisma baseline migration plan");
  console.log(`  target schema: ${getDatabaseSchemaFromUrl(process.env.DATABASE_URL!)}`);
  console.log(`  baseline migration: ${plan.baselineMigration}`);
  console.log(`  status: ${plan.status}`);

  for (const reason of plan.reasons) {
    console.log(`  reason: ${reason}`);
  }

  console.log("  recommended commands:");
  for (const command of plan.recommendedCommands) {
    console.log(`    - ${command}`);
  }

  if (!args.apply) {
    console.log("  apply: skipped (pass --apply to mark baseline as applied)");
    return;
  }

  if (plan.status !== "baseline-required") {
    throw new Error(
      `Baseline apply is only allowed when status is baseline-required, got ${plan.status}.`,
    );
  }

  await applyBaseline();
  console.log(`  apply: completed (${PRISMA_BASELINE_MIGRATION})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
