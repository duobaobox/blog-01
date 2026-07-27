import assert from "node:assert/strict";
import test from "node:test";
import { formatDate } from "./date";

test("formatDate uses the public Asia/Shanghai timezone", () => {
  assert.equal(formatDate("2026-07-26T16:30:00.000Z"), "2026年7月27日");
});

test("formatDate returns an empty string for invalid input", () => {
  assert.equal(formatDate("not-a-date"), "");
});
