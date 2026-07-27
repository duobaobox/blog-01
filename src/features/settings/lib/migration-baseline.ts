import { ValidationError } from "@/shared/lib/app-error";

export const PRISMA_BASELINE_MIGRATION = "20260615062322_baseline_init";

export type MigrationStateSnapshot = {
  hasMigrationsTable: boolean;
  tableCount: number;
  appliedMigrationNames: string[];
  pendingMigrationNames: string[];
  unfinishedMigrationNames: string[];
};

export type MigrationBaselinePlan = {
  status: "empty" | "baseline-required" | "ready" | "blocked";
  baselineMigration: string;
  reasons: string[];
  recommendedCommands: string[];
};

export function buildMigrationBaselinePlan(
  snapshot: MigrationStateSnapshot,
): MigrationBaselinePlan {
  const baselineMigration = PRISMA_BASELINE_MIGRATION;

  if (snapshot.unfinishedMigrationNames.length > 0) {
    return {
      status: "blocked",
      baselineMigration,
      reasons: [
        `存在未完成 migration：${snapshot.unfinishedMigrationNames.join(", ")}`,
      ],
      recommendedCommands: ["npx prisma migrate status"],
    };
  }

  if (!snapshot.hasMigrationsTable) {
    if (snapshot.tableCount === 0) {
      return {
        status: "empty",
        baselineMigration,
        reasons: ["当前数据库为空，可以直接通过 Prisma Migrate 建立结构。"],
        recommendedCommands: ["npx prisma migrate deploy"],
      };
    }

    return {
      status: "baseline-required",
      baselineMigration,
      reasons: ["数据库已有业务表，但缺少 Prisma migration 历史。"],
      recommendedCommands: [
        "npm run db:check:migrations",
        "npm run db:baseline",
        `npx prisma migrate resolve --applied ${baselineMigration}`,
      ],
    };
  }

  if (snapshot.appliedMigrationNames.includes(baselineMigration)) {
    return {
      status: "ready",
      baselineMigration,
      reasons: ["baseline migration 已记录，可以继续沿用 Prisma Migrate。"],
      recommendedCommands: [
        "npx prisma migrate status",
        "DB_SCHEMA_SYNC_MODE=migrate docker compose run --rm --profile tools migrate",
      ],
    };
  }

  return {
    status: "baseline-required",
    baselineMigration,
    reasons: [
      "migration 表已经存在，但 baseline migration 还没有被标记为已应用。",
    ],
    recommendedCommands: [
      "npm run db:baseline",
      `npx prisma migrate resolve --applied ${baselineMigration}`,
      "npx prisma migrate status",
    ],
  };
}

export function parseBaselineCliArgs(argv: readonly string[]) {
  const apply = argv.includes("--apply");
  const printJson = argv.includes("--json");
  const unknownArgs = argv.filter(
    (arg) => !["--apply", "--json"].includes(arg),
  );

  if (unknownArgs.length > 0) {
    throw new ValidationError(`Unsupported args: ${unknownArgs.join(", ")}`);
  }

  return {
    apply,
    printJson,
  };
}
