import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const templatePath = path.join(
  process.cwd(),
  "delivery",
  "offline",
  "docker-compose.offline.yml",
);

test("offline compose template exists and contains required services", async () => {
  const template = await readFile(templatePath, "utf8");

  assert.match(template, /__APP_IMAGE__/);
  assert.match(template, /__POSTGRES_IMAGE__/);
  assert.match(template, /^\s+app:/m);
  assert.match(template, /^\s+db:/m);
  assert.match(template, /^\s+migrate:/m);
  assert.match(template, /^\s+seed:/m);
});

test("offline compose template exposes install-config anchors", async () => {
  const template = await readFile(templatePath, "utf8");

  assert.match(template, /database-url: &database-url/);
  assert.match(template, /better-auth-secret: &better-auth-secret/);
  assert.match(template, /better-auth-url: &better-auth-url/);
  assert.match(template, /site-url: &site-url/);
  assert.match(template, /published: \*app-port/);
  assert.match(template, /\$\$\{POSTGRES_USER\}/);
  assert.match(template, /\$\$\{POSTGRES_DB\}/);
});
