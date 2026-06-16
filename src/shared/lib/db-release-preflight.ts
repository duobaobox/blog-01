import { ValidationError } from "@/shared/lib/app-error";

export type DbReleasePreflightArgs = {
  includeSchemaDiff: boolean;
  includePostsExplain: boolean;
  includeMediaBackfillPlan: boolean;
  printHelp: boolean;
};

export type DbReleasePreflightStep = {
  id:
    | "check-sync-mode"
    | "check-migrations"
    | "check-migration-coverage"
    | "baseline-plan"
    | "check-site-settings"
    | "schema-diff"
    | "posts-explain"
    | "media-backfill-plan";
  title: string;
  command: string[];
  optional: boolean;
};

export const DB_RELEASE_REQUIRED_GATE_IDS = [
  "check-sync-mode",
  "check-migrations",
  "check-migration-coverage",
  "baseline-plan",
  "check-site-settings",
] as const satisfies readonly DbReleasePreflightStep["id"][];

export type DbReleaseEnvironmentPath = {
  id:
    | "new-environment"
    | "legacy-baseline-transition"
    | "migration-managed"
    | "blocked-environment";
  environmentKinds: string[];
  releaseMode: string;
  requiredGate: string;
  standardAction: string;
};

export type DbMigrationReadinessMode = {
  environmentKind: "baseline-ready" | "migration-ready";
  releaseClaim: string;
  releaseAllowed: boolean;
  requiredEvidence: string[];
  operationalMeaning: string;
};

export const DB_MIGRATION_READINESS_MATRIX: readonly DbMigrationReadinessMode[] = [
  {
    environmentKind: "baseline-ready",
    releaseClaim: "migrate deploy can be attempted after baseline resolve",
    releaseAllowed: true,
    requiredEvidence: [
      "baseline migration is applied",
      "db:check:migration-coverage has been reviewed",
      "missing repository migrations are understood before claiming full readiness",
    ],
    operationalMeaning:
      "The environment has entered Prisma Migrate semantics, but may still need later repository migrations applied before it is fully current.",
  },
  {
    environmentKind: "migration-ready",
    releaseClaim: "environment is fully current with repository migrations",
    releaseAllowed: true,
    requiredEvidence: [
      "baseline migration is applied",
      "db:check:migration-coverage reports fully applied",
      "db:check:migrations reports no unfinished rows",
    ],
    operationalMeaning:
      "The environment can be released with DB_SCHEMA_SYNC_MODE=migrate without additional baseline or coverage interpretation.",
  },
];

export const DB_RELEASE_ENVIRONMENT_PATHS: readonly DbReleaseEnvironmentPath[] = [
  {
    id: "new-environment",
    environmentKinds: ["empty"],
    releaseMode: "DB_SCHEMA_SYNC_MODE=migrate",
    requiredGate: "db:preflight:release -- --schema",
    standardAction: "Run migrate deploy through the shared schema-sync entrypoint.",
  },
  {
    id: "legacy-baseline-transition",
    environmentKinds: ["legacy-without-history"],
    releaseMode: "DB_SCHEMA_SYNC_MODE=auto or push until baseline resolve is applied",
    requiredGate: "db:preflight:release -- --schema plus db:rehearse:baseline when possible",
    standardAction: "Apply db:baseline -- --apply, then re-run preflight before switching to migrate.",
  },
  {
    id: "migration-managed",
    environmentKinds: ["baseline-ready", "migration-ready"],
    releaseMode: "DB_SCHEMA_SYNC_MODE=migrate",
    requiredGate: "db:preflight:release -- --schema with complete migration coverage",
    standardAction: "Run migrate deploy; treat missing coverage as a release blocker for fully migration-ready claims.",
  },
  {
    id: "blocked-environment",
    environmentKinds: ["migration-blocked"],
    releaseMode: "no release",
    requiredGate: "db:check:migrations and prisma migrate status",
    standardAction: "Inspect or repair the failed migration state before deploying.",
  },
];

export function parseDbReleasePreflightArgs(
  argv: readonly string[],
): DbReleasePreflightArgs {
  const args = new Set(argv);
  const supportedArgs = new Set([
    "--schema",
    "--posts",
    "--media",
    "--all",
    "--help",
  ]);

  const unknownArgs = argv.filter((arg) => !supportedArgs.has(arg));

  if (unknownArgs.length > 0) {
    throw new ValidationError(`Unsupported args: ${unknownArgs.join(", ")}`);
  }

  const includeAll = args.has("--all");

  return {
    includeSchemaDiff: includeAll || args.has("--schema"),
    includePostsExplain: includeAll || args.has("--posts"),
    includeMediaBackfillPlan: includeAll || args.has("--media"),
    printHelp: args.has("--help"),
  };
}

export function buildDbReleasePreflightSteps(
  args: DbReleasePreflightArgs,
): DbReleasePreflightStep[] {
  const steps: DbReleasePreflightStep[] = [
    {
      id: "check-sync-mode",
      title: "Check schema sync mode recommendation",
      command: ["run", "db:check:sync-mode", "--", "--assert-env-mode"],
      optional: false,
    },
    {
      id: "check-migrations",
      title: "Check migration state",
      command: ["run", "db:check:migrations"],
      optional: false,
    },
    {
      id: "check-migration-coverage",
      title: "Check migration coverage against repository",
      command: ["run", "db:check:migration-coverage"],
      optional: false,
    },
    {
      id: "baseline-plan",
      title: "Review baseline plan",
      command: ["run", "db:baseline"],
      optional: false,
    },
    {
      id: "check-site-settings",
      title: "Check site settings singleton",
      command: ["run", "db:check:site-settings"],
      optional: false,
    },
  ];

  if (args.includeSchemaDiff) {
    steps.push({
      id: "schema-diff",
      title: "Preview schema diff",
      command: ["run", "db:diff"],
      optional: true,
    });
  }

  if (args.includePostsExplain) {
    steps.push({
      id: "posts-explain",
      title: "Inspect posts query plan",
      command: ["run", "db:explain:posts"],
      optional: true,
    });
  }

  if (args.includeMediaBackfillPlan) {
    steps.push({
      id: "media-backfill-plan",
      title: "Review post media reference backfill plan",
      command: ["run", "db:backfill:post-media-references"],
      optional: true,
    });
  }

  return steps;
}

export function getDbReleaseRequiredGateIds() {
  return [...DB_RELEASE_REQUIRED_GATE_IDS];
}

export function getDbReleasePreflightHelpText() {
  return [
    "Usage: npm run db:preflight:release -- [--schema] [--posts] [--media] [--all]",
    "",
    "Always runs:",
    "  - db:check:sync-mode",
    "  - db:check:migrations",
    "  - db:check:migration-coverage",
    "  - db:baseline",
    "  - db:check:site-settings",
    "",
    "Optional flags:",
    "  --schema  Include db:diff",
    "  --posts   Include db:explain:posts",
    "  --media   Include db:backfill:post-media-references dry-run plan",
    "  --all     Include every optional check",
    "  --help    Show this message",
    "",
    "Release paths:",
    ...DB_RELEASE_ENVIRONMENT_PATHS.flatMap((path) => [
      `  - ${path.id}`,
      `    environment kind: ${path.environmentKinds.join(", ")}`,
      `    release mode: ${path.releaseMode}`,
      `    required gate: ${path.requiredGate}`,
      `    standard action: ${path.standardAction}`,
    ]),
    "",
    "Migration readiness:",
    ...DB_MIGRATION_READINESS_MATRIX.flatMap((mode) => [
      `  - ${mode.environmentKind}`,
      `    claim: ${mode.releaseClaim}`,
      `    evidence: ${mode.requiredEvidence.join("; ")}`,
      `    meaning: ${mode.operationalMeaning}`,
    ]),
  ].join("\n");
}
