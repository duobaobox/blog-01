import { ValidationError } from "@/shared/lib/app-error";

type ScalableDemoPostSeed = {
  title: string;
  slug: string;
  excerpt: string;
  createdDaysAgo: number;
  publishedDaysAgo: number | null;
};

const DEFAULT_DEMO_POST_SEED_SCALE = 1;
const MAX_DEMO_POST_SEED_SCALE = 20;

function parseScaleValue(value: string | undefined) {
  if (!value) {
    return DEFAULT_DEMO_POST_SEED_SCALE;
  }

  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_DEMO_POST_SEED_SCALE
  ) {
    throw new ValidationError(
      `Demo post seed scale must be an integer between 1 and ${MAX_DEMO_POST_SEED_SCALE}.`,
    );
  }

  return parsed;
}

export function parseDemoPostSeedScale(input: {
  argv: readonly string[];
  env?: Record<string, string | undefined>;
}) {
  const scaleArg = input.argv.find((arg) => arg.startsWith("--scale="));
  const unknownArgs = input.argv.filter((arg) => !arg.startsWith("--scale="));

  if (unknownArgs.length > 0) {
    throw new ValidationError(`Unsupported args: ${unknownArgs.join(", ")}`);
  }

  return parseScaleValue(
    scaleArg?.slice("--scale=".length) ?? input.env?.DEMO_POST_SEED_SCALE,
  );
}

export function expandDemoPostSeeds<TSeed extends ScalableDemoPostSeed>(
  seeds: readonly TSeed[],
  scale: number,
): TSeed[] {
  if (scale === 1) {
    return [...seeds];
  }

  return Array.from({ length: scale }).flatMap((_, scaleIndex) =>
    seeds.map((seed, seedIndex) => {
      if (scaleIndex === 0) {
        return seed;
      }

      const sampleNumber = scaleIndex + 1;
      const dayOffset = scaleIndex * seeds.length + seedIndex;

      return {
        ...seed,
        title: `${seed.title} · 样本 ${sampleNumber}`,
        slug: `${seed.slug}-sample-${sampleNumber}`,
        excerpt: `${seed.excerpt}（性能样本 ${sampleNumber}）`,
        createdDaysAgo: seed.createdDaysAgo + dayOffset,
        publishedDaysAgo:
          seed.publishedDaysAgo === null
            ? null
            : seed.publishedDaysAgo + dayOffset,
      };
    }),
  );
}
