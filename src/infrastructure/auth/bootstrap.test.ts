import test from "node:test";
import assert from "node:assert/strict";

import {
  getDefaultAdminCredentials,
} from "@/infrastructure/auth/bootstrap";

test("getDefaultAdminCredentials falls back to built-in defaults", () => {
  const previousName = process.env.SEED_ADMIN_NAME;
  const previousUsername = process.env.SEED_ADMIN_USERNAME;
  const previousEmail = process.env.SEED_ADMIN_EMAIL;
  const previousPassword = process.env.SEED_ADMIN_PASSWORD;

  delete process.env.SEED_ADMIN_NAME;
  delete process.env.SEED_ADMIN_USERNAME;
  delete process.env.SEED_ADMIN_EMAIL;
  delete process.env.SEED_ADMIN_PASSWORD;

  const credentials = getDefaultAdminCredentials();

  assert.deepEqual(credentials, {
    name: "Admin",
    username: "admin",
    email: "admin@example.com",
    password: "admin123456",
  });

  process.env.SEED_ADMIN_NAME = previousName;
  process.env.SEED_ADMIN_USERNAME = previousUsername;
  process.env.SEED_ADMIN_EMAIL = previousEmail;
  process.env.SEED_ADMIN_PASSWORD = previousPassword;
});

test("getDefaultAdminCredentials respects configured seed values", () => {
  const previousName = process.env.SEED_ADMIN_NAME;
  const previousUsername = process.env.SEED_ADMIN_USERNAME;
  const previousEmail = process.env.SEED_ADMIN_EMAIL;
  const previousPassword = process.env.SEED_ADMIN_PASSWORD;

  process.env.SEED_ADMIN_NAME = "Owner";
  process.env.SEED_ADMIN_USERNAME = "Owner-01 ";
  process.env.SEED_ADMIN_EMAIL = "Owner@Example.com ";
  process.env.SEED_ADMIN_PASSWORD = "secret-pass";

  const credentials = getDefaultAdminCredentials();

  assert.deepEqual(credentials, {
    name: "Owner",
    username: "owner-01",
    email: "owner@example.com",
    password: "secret-pass",
  });

  if (previousName === undefined) delete process.env.SEED_ADMIN_NAME;
  else process.env.SEED_ADMIN_NAME = previousName;

  if (previousUsername === undefined) delete process.env.SEED_ADMIN_USERNAME;
  else process.env.SEED_ADMIN_USERNAME = previousUsername;

  if (previousEmail === undefined) delete process.env.SEED_ADMIN_EMAIL;
  else process.env.SEED_ADMIN_EMAIL = previousEmail;

  if (previousPassword === undefined) delete process.env.SEED_ADMIN_PASSWORD;
  else process.env.SEED_ADMIN_PASSWORD = previousPassword;
});
