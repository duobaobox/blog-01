import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
  ConfigurationError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/app-error";
import { getErrorStatus, getPublicErrorMessage } from "@/shared/lib/api-error";

test("getErrorStatus maps known app errors to HTTP status codes", () => {
  assert.equal(getErrorStatus(new UnauthorizedError()), 401);
  assert.equal(getErrorStatus(new ForbiddenError()), 403);
  assert.equal(getErrorStatus(new ValidationError("Invalid")), 400);
  assert.equal(getErrorStatus(new NotFoundError("Missing")), 404);
  assert.equal(getErrorStatus(new ConflictError("In use")), 409);
  assert.equal(getErrorStatus(new ConfigurationError("Broken config")), 500);
});

test("getPublicErrorMessage hides internal and configuration errors", () => {
  assert.equal(
    getPublicErrorMessage(new ValidationError("Invalid input"), "Fallback"),
    "Invalid input",
  );
  assert.equal(
    getPublicErrorMessage(new ConflictError("Still referenced"), "Fallback"),
    "Still referenced",
  );
  assert.equal(
    getPublicErrorMessage(
      new ConfigurationError("secret config detail"),
      "Fallback",
    ),
    "Fallback",
  );
  assert.equal(
    getPublicErrorMessage(new Error("unexpected"), "Fallback"),
    "Fallback",
  );
});
