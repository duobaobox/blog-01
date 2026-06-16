import assert from "node:assert/strict";
import test from "node:test";
import {
  expandDemoPostSeeds,
  parseDemoPostSeedScale,
} from "./demo-post-seed-scale";

const seeds = [
  {
    title: "First",
    slug: "first",
    excerpt: "First excerpt",
    createdDaysAgo: 1,
    publishedDaysAgo: 1,
  },
  {
    title: "Draft",
    slug: "draft",
    excerpt: "Draft excerpt",
    createdDaysAgo: 2,
    publishedDaysAgo: null,
  },
];

test("parseDemoPostSeedScale defaults to one and accepts cli or env scale", () => {
  assert.equal(parseDemoPostSeedScale({ argv: [] }), 1);
  assert.equal(parseDemoPostSeedScale({ argv: ["--scale=3"] }), 3);
  assert.equal(
    parseDemoPostSeedScale({
      argv: [],
      env: {
        DEMO_POST_SEED_SCALE: "4",
      },
    }),
    4,
  );
});

test("parseDemoPostSeedScale rejects unsupported or unsafe values", () => {
  assert.throws(() => parseDemoPostSeedScale({ argv: ["--unknown"] }));
  assert.throws(() => parseDemoPostSeedScale({ argv: ["--scale=0"] }));
  assert.throws(() => parseDemoPostSeedScale({ argv: ["--scale=21"] }));
  assert.throws(() => parseDemoPostSeedScale({ argv: ["--scale=1.5"] }));
});

test("expandDemoPostSeeds creates deterministic unique performance samples", () => {
  const expanded = expandDemoPostSeeds(seeds, 3);

  assert.equal(expanded.length, 6);
  assert.deepEqual(
    expanded.map((seed) => seed.slug),
    [
      "first",
      "draft",
      "first-sample-2",
      "draft-sample-2",
      "first-sample-3",
      "draft-sample-3",
    ],
  );
  assert.equal(expanded[2]?.title, "First · 样本 2");
  assert.equal(expanded[3]?.publishedDaysAgo, null);
  assert.ok(new Set(expanded.map((seed) => seed.slug)).size === expanded.length);
});
