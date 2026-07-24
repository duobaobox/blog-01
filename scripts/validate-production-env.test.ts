import assert from "node:assert/strict";
import test from "node:test";
import { validateProductionEnvironment } from "./validate-production-env.mjs";

const validEnvironment = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://blog:a-strong-database-password@db:5432/blog?schema=public",
  BETTER_AUTH_SECRET: "a-secure-auth-secret-with-more-than-32-characters",
  BETTER_AUTH_URL: "https://blog.example.com",
  SITE_URL: "https://blog.example.com",
  ADMIN_SETUP_TOKEN: "a-secure-setup-token",
};

test("production environment validation accepts complete strong configuration", () => {
  assert.deepEqual(validateProductionEnvironment(validEnvironment), { warnings: [] });
});

test("production environment validation rejects missing and weak secrets", () => {
  assert.throws(
    () => validateProductionEnvironment({
      ...validEnvironment,
      DATABASE_URL: "postgresql://blog:blog@db:5432/blog",
      BETTER_AUTH_SECRET: "change-this-secret",
      ADMIN_SETUP_TOKEN: "",
    }),
    /Production environment validation failed/
  );
});

test("production environment validation rejects localhost URLs", () => {
  assert.throws(
    () => validateProductionEnvironment({
      ...validEnvironment,
      BETTER_AUTH_URL: "http://localhost:3000",
    }),
    /must not use localhost/
  );
});

test("non-production environment is not blocked", () => {
  assert.deepEqual(validateProductionEnvironment({ NODE_ENV: "development" }), { warnings: [] });
});
