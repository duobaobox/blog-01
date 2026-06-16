import "dotenv/config";
import { Client } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

type CountRow = {
  total: string;
};

type ColumnRow = {
  exists: boolean;
};

type ScopeRow = {
  scopeKey: string | null;
  count: string;
};

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    const [{ total }] = (
      await client.query<CountRow>('SELECT COUNT(*) AS total FROM "siteSetting"')
    ).rows;
    const totalRows = Number(total);

    const [{ exists: hasScopeKey }] = (
      await client.query<ColumnRow>(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'siteSetting'
            AND column_name = 'scopeKey'
        ) AS "exists"
      `)
    ).rows;

    console.log("Checking siteSetting singleton semantics...");
    console.log(`  total rows: ${totalRows}`);

    if (!hasScopeKey) {
      console.log('  scopeKey column: missing');

      if (totalRows > 1) {
        throw new Error(
          'siteSetting has multiple rows before singleton key rollout. Deduplicate rows before applying the new schema.',
        );
      }

      console.log(
        '  status: pre-singleton-key schema is still compatible because row count is <= 1.',
      );
      return;
    }

    console.log('  scopeKey column: present');

    const scopeRows = (
      await client.query<ScopeRow>(`
        SELECT "scopeKey", COUNT(*) AS count
        FROM "siteSetting"
        GROUP BY "scopeKey"
        ORDER BY "scopeKey" ASC NULLS FIRST
      `)
    ).rows.map((row) => ({
      scopeKey: row.scopeKey,
      count: Number(row.count),
    }));

    const defaultRow = scopeRows.find((row) => row.scopeKey === "default");
    const nonDefaultRows = scopeRows.filter((row) => row.scopeKey !== "default");

    for (const row of scopeRows) {
      console.log(`  scope ${row.scopeKey ?? "<null>"}: ${row.count}`);
    }

    if (defaultRow && defaultRow.count > 1) {
      throw new Error('siteSetting has more than one "default" row.');
    }

    if (nonDefaultRows.length > 0) {
      throw new Error(
        'siteSetting contains non-default scopeKey rows. The application expects a single "default" settings record.',
      );
    }

    if (totalRows > 1) {
      throw new Error(
        "siteSetting contains multiple rows. Consolidate data back to a single default record.",
      );
    }

    console.log('  status: singleton semantics look healthy.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
