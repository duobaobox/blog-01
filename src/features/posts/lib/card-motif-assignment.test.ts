import assert from "node:assert/strict";
import test from "node:test";
import { cardMotifs } from "@/features/posts/components/card-motifs";
import {
  assignMotifIndices,
  CARD_MOTIF_COUNT,
  getMotifIndex,
  resolveMotifIndex,
} from "./card-motif-assignment";

test("motif assignment count matches the visual registry", () => {
  assert.equal(CARD_MOTIF_COUNT, cardMotifs.length);
});

test("getMotifIndex is deterministic and stays in range", () => {
  const first = getMotifIndex("stable-post-slug");
  const second = getMotifIndex("stable-post-slug");

  assert.equal(first, second);
  assert.ok(first >= 0 && first < CARD_MOTIF_COUNT);
});

test("assignMotifIndices is deterministic and avoids adjacent duplicates", () => {
  const slugs = ["alpha", "alpha", "beta", "gamma", "gamma", "delta"];
  const first = assignMotifIndices(slugs);
  const second = assignMotifIndices(slugs);

  assert.deepEqual(first, second);
  assert.equal(first.length, slugs.length);

  for (let index = 1; index < first.length; index += 1) {
    assert.notEqual(first[index], first[index - 1]);
  }
});

test("resolveMotifIndex normalizes external indices", () => {
  assert.equal(resolveMotifIndex(-1, "fallback"), CARD_MOTIF_COUNT - 1);
  assert.equal(resolveMotifIndex(CARD_MOTIF_COUNT + 2, "fallback"), 2);
  assert.equal(resolveMotifIndex(undefined, "fallback"), getMotifIndex("fallback"));
});
