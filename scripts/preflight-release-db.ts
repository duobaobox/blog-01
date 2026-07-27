import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  buildDbReleasePreflightSteps,
  getDbReleasePreflightHelpText,
  parseDbReleasePreflightArgs,
} from "@/shared/lib/db-release-preflight";

const execFileAsync = promisify(execFile);

async function runStep(
  step: ReturnType<typeof buildDbReleasePreflightSteps>[number],
) {
  console.log(`\n== ${step.title} ==`);
  console.log(`$ npm ${step.command.join(" ")}`);

  const result = await execFileAsync("npm", step.command, {
    env: {
      ...process.env,
      PRISMA_HIDE_UPDATE_MESSAGE: "true",
    },
  });

  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }

  if (result.stderr.trim()) {
    console.log(result.stderr.trim());
  }
}

async function main() {
  const args = parseDbReleasePreflightArgs(process.argv.slice(2));

  if (args.printHelp) {
    console.log(getDbReleasePreflightHelpText());
    return;
  }

  const steps = buildDbReleasePreflightSteps(args);

  console.log("Starting DB release preflight...");
  console.log(
    `  required checks: ${steps.filter((step) => !step.optional).length}`,
  );
  console.log(
    `  optional checks: ${steps.filter((step) => step.optional).length}`,
  );

  for (const step of steps) {
    await runStep(step);
  }

  console.log("\nDB release preflight completed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
