import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { parseAccountProfileInput } from "./account-write";

test("parseAccountProfileInput trims names", () => {
  assert.deepEqual(parseAccountProfileInput({ name: "  Alice  " }), {
    name: "Alice",
  });
});

test("parseAccountProfileInput rejects empty names", () => {
  assert.throws(
    () => parseAccountProfileInput({ name: "   " }),
    ValidationError,
  );
});
