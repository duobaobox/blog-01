import assert from "node:assert/strict";
import test from "node:test";
import {
  isAdminBootstrapRequestAllowed,
  parseBootstrapTokenFromHeaders,
} from "./bootstrap-token";

test("parseBootstrapTokenFromHeaders reads the setup token header", () => {
  const headers = new Headers({ "x-admin-setup-token": "  secret-token  " });

  assert.equal(parseBootstrapTokenFromHeaders(headers), "secret-token");
});

test("production bootstrap rejects missing configured token", () => {
  assert.equal(
    isAdminBootstrapRequestAllowed({
      configuredToken: "",
      requestToken: "secret-token",
      nodeEnv: "production",
    }),
    false,
  );
});

test("production bootstrap rejects missing request token", () => {
  assert.equal(
    isAdminBootstrapRequestAllowed({
      configuredToken: "secret-token",
      requestToken: null,
      nodeEnv: "production",
    }),
    false,
  );
});

test("production bootstrap accepts matching request token", () => {
  assert.equal(
    isAdminBootstrapRequestAllowed({
      configuredToken: "secret-token",
      requestToken: "secret-token",
      nodeEnv: "production",
    }),
    true,
  );
});

test("development bootstrap remains open when no setup token is configured", () => {
  assert.equal(
    isAdminBootstrapRequestAllowed({
      configuredToken: "",
      requestToken: null,
      nodeEnv: "development",
    }),
    true,
  );
});
