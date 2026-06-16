import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "pg";

const execFileAsync = promisify(execFile);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

function buildRehearsalSchemaName() {
  return `baseline_rehearsal_${Date.now()}`;
}

function buildSchemaUrl(baseUrl: string, schema: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

async function runCommand(
  title: string,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
) {
  console.log(`\n== ${title} ==`);
  console.log(`$ ${command} ${args.join(" ")}`);

  const result = await execFileAsync(command, args, {
    env,
  });

  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }

  if (result.stderr.trim()) {
    console.log(result.stderr.trim());
  }
}

async function dropSchema(schema: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await client.end();
  }
}

async function main() {
  const rehearsalSchema = buildRehearsalSchemaName();
  const rehearsalUrl = buildSchemaUrl(process.env.DATABASE_URL!, rehearsalSchema);
  const commandEnv = {
    ...process.env,
    DATABASE_URL: rehearsalUrl,
    PRISMA_HIDE_UPDATE_MESSAGE: "true",
  };

  console.log("Starting Prisma baseline rehearsal...");
  console.log(`  base database: ${process.env.DATABASE_URL}`);
  console.log(`  rehearsal schema: ${rehearsalSchema}`);

  try {
    await runCommand(
      "Simulate legacy schema delivery with db push",
      "npx",
      ["prisma", "db", "push", "--schema", "prisma/schema.prisma"],
      commandEnv,
    );

    await runCommand(
      "Inspect migration state after legacy db push",
      "npx",
      ["tsx", "scripts/check-migration-state.ts"],
      commandEnv,
    );

    await runCommand(
      "Create baseline plan",
      "npx",
      ["tsx", "scripts/baseline-migration.ts"],
      commandEnv,
    );

    await runCommand(
      "Apply baseline migration record",
      "npx",
      ["tsx", "scripts/baseline-migration.ts", "--apply"],
      commandEnv,
    );

    await runCommand(
      "Confirm migration status after baseline resolve",
      "npx",
      ["prisma", "migrate", "status", "--schema", "prisma/schema.prisma"],
      commandEnv,
    );

    await runCommand(
      "Run migrate deploy on rehearsed schema",
      "npx",
      ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
      commandEnv,
    );

    await runCommand(
      "Verify migration state after migrate deploy",
      "npx",
      ["tsx", "scripts/check-migration-state.ts"],
      commandEnv,
    );

    console.log("\nRehearsal completed successfully.");
  } finally {
    await dropSchema(rehearsalSchema);
    console.log(`Cleaned up rehearsal schema: ${rehearsalSchema}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
