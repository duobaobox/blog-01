import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPageHref,
  getPaginationPages,
  getTotalPages,
  parsePageParam,
} from "./pagination";

test("parsePageParam returns the first page when no query is provided", () => {
  assert.equal(parsePageParam(undefined), 1);
});

test("parsePageParam rejects invalid page values", () => {
  assert.equal(parsePageParam("0"), null);
  assert.equal(parsePageParam("-1"), null);
  assert.equal(parsePageParam("abc"), null);
});

test("buildPageHref omits the page query for the first page", () => {
  assert.equal(buildPageHref("/blog", 1), "/blog");
  assert.equal(buildPageHref("/blog", 3), "/blog?page=3");
});

test("getTotalPages rounds up and keeps at least one page", () => {
  assert.equal(getTotalPages(0, 10), 1);
  assert.equal(getTotalPages(21, 10), 3);
});

test("getPaginationPages inserts ellipses for long page ranges", () => {
  assert.deepEqual(getPaginationPages(5, 10), [1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
});
